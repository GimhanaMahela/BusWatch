import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import type { Language, ReportType } from "../config/constants.js";
import { DATE_LOCALES, messagesFor } from "../i18n/messages.js";
import { generateReceiptId } from "../utils/receipt-id.js";

export interface ReceiptData {
  receiptId?: string;
  type?: ReportType;
  language?: Language;
  busNumber: string;
  routeNumber: string;
  busName?: string;
  category?: string;
  location?: string | null;
  incidentAt?: Date | string;
  reportedAt: Date | string;
  description: string;
  images?: string[];
}

export interface ReceiptResult {
  pdfBuffer: Buffer;
  receiptId: string;
}

interface DownloadedImage {
  buffer: Buffer | null;
  index: number;
  filename: string;
}

// ---------------------------------------------------------------- Fonts and mixed-script text

// Same relative path from src/services (tsx) and dist/services (compiled)
const fontPath = (file: string) =>
  fileURLToPath(new URL(`../../assets/fonts/${file}`, import.meta.url));

type Script = "latin" | "sinhala" | "tamil";

const FONTS: Record<Script, { regular: string; bold: string }> = {
  latin: { regular: "Helvetica", bold: "Helvetica-Bold" },
  sinhala: { regular: "sinhala", bold: "sinhala-bold" },
  tamil: { regular: "tamil", bold: "tamil-bold" },
};

const registerFonts = (doc: PDFKit.PDFDocument) => {
  doc.registerFont("sinhala", fontPath("NotoSansSinhala-Regular.ttf"));
  doc.registerFont("sinhala-bold", fontPath("NotoSansSinhala-Bold.ttf"));
  doc.registerFont("tamil", fontPath("NotoSansTamil-Regular.ttf"));
  doc.registerFont("tamil-bold", fontPath("NotoSansTamil-Bold.ttf"));
};

const ZERO_WIDTH_JOINERS = /[‌‍]/;

const scriptOf = (char: string): Script | null => {
  const code = char.codePointAt(0) ?? 0;
  if (code >= 0x0d80 && code <= 0x0dff) return "sinhala";
  if (code >= 0x0b80 && code <= 0x0bff) return "tamil";
  // Spaces and joiners belong to whichever script they sit in
  if (/\s/.test(char) || ZERO_WIDTH_JOINERS.test(char)) return null;
  return "latin";
};

/**
 * Splits text into runs that one font can draw: Helvetica has no Sinhala or Tamil glyphs, and the
 * Tamil font has no Latin letters. Passengers often mix scripts ("NB-1234 බස් රථය").
 */
export const scriptRuns = (text: string): { script: Script; text: string }[] => {
  const runs: { script: Script; text: string }[] = [];
  let pending = ""; // leading neutral characters wait for the first real script
  for (const char of text) {
    const script = scriptOf(char);
    const last = runs.at(-1);
    if (script === null) {
      if (last) last.text += char;
      else pending += char;
    } else if (last && last.script === script) {
      last.text += char;
    } else {
      runs.push({ script, text: pending + char });
      pending = "";
    }
  }
  if (pending) runs.push({ script: "latin", text: pending });
  return runs;
};

export interface Segment {
  text: string;
  bold?: boolean;
  color?: string;
}

interface WriteOptions {
  x?: number;
  y?: number;
  width?: number;
  size?: number;
  bold?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  lineGap?: number;
  underline?: boolean;
}

interface Fragment {
  text: string;
  font: string;
  color: string;
  width: number;
  space: boolean;
  /** Continues the previous fragment's word (a script change inside one word) */
  glued: boolean;
}

/**
 * Measures and word-wraps text that may mix Latin, Sinhala and Tamil. pdfkit's own "continued"
 * text overlaps lines when the font changes mid-paragraph, so we lay lines out ourselves.
 */
const layoutText = (
  doc: PDFKit.PDFDocument,
  content: string | Segment[],
  {
    x = doc.page.margins.left,
    width = doc.page.width - x - doc.page.margins.right,
    size = 12,
    bold = false,
    color = COLORS.text,
    lineGap = 0,
  }: WriteOptions = {},
) => {
  const segments = typeof content === "string" ? [{ text: content }] : content;
  const fragments: Fragment[][] = [[]]; // lines split on explicit "\n"
  let indic = false;
  doc.fontSize(size);

  for (const segment of segments) {
    const segmentColor = segment.color ?? color;
    const segmentBold = segment.bold ?? bold;
    // Tokens are words, runs of spaces, or line breaks
    for (const token of segment.text.split(/(\n|[^\S\n]+)/)) {
      if (!token) continue;
      if (token === "\n") {
        fragments.push([]);
        continue;
      }
      const space = /^\s+$/.test(token);
      const runs = space ? [{ script: "latin" as Script, text: " " }] : scriptRuns(token);
      runs.forEach((run, i) => {
        if (run.script !== "latin") indic = true;
        const font = FONTS[run.script][segmentBold ? "bold" : "regular"];
        doc.font(font);
        fragments.at(-1)?.push({
          text: run.text,
          font,
          color: segmentColor,
          width: doc.widthOfString(run.text),
          space,
          glued: i > 0,
        });
      });
    }
  }

  // Greedy word wrap
  const lines: Fragment[][] = [];
  for (const paragraph of fragments) {
    let line: Fragment[] = [];
    let lineWidth = 0;
    let i = 0;
    while (i < paragraph.length) {
      // A "word" is a fragment plus any glued fragments (other scripts inside the same word)
      let j = i + 1;
      while (j < paragraph.length && paragraph[j]?.glued) j++;
      const word = paragraph.slice(i, j);
      const wordWidth = word.reduce((sum, f) => sum + f.width, 0);
      const isSpace = word.length === 1 && word[0]?.space;
      if (!isSpace && line.length && lineWidth + wordWidth > width) {
        lines.push(line);
        line = [];
        lineWidth = 0;
      }
      if (!(isSpace && line.length === 0)) {
        line.push(...word);
        lineWidth += wordWidth;
      }
      i = j;
    }
    lines.push(line);
  }

  // Noto's Sinhala and Tamil glyphs reach higher and lower than Helvetica's
  const lineHeight = size * (indic ? 1.75 : 1.3) + lineGap;
  const ascent = size * (indic ? 1.2 : 0.95);
  for (const line of lines) while (line.length && line.at(-1)?.space) line.pop();
  return { lines, lineHeight, ascent, height: lines.length * lineHeight };
};

/** Draws text laid out by layoutText on a shared baseline, moves doc.y below it, adds pages as needed. */
const writeText = (
  doc: PDFKit.PDFDocument,
  content: string | Segment[],
  options: WriteOptions = {},
) => {
  const {
    x = doc.page.margins.left,
    y = doc.y,
    width = doc.page.width - x - doc.page.margins.right,
    color = COLORS.text,
    align = "left",
    underline = false,
  } = options;
  const { lines, lineHeight, ascent } = layoutText(doc, content, { ...options, x, width });
  let top = y;

  for (const line of lines) {
    if (
      top + lineHeight > doc.page.height - doc.page.margins.bottom &&
      top > doc.page.margins.top
    ) {
      doc.addPage({ margin: 50 });
      top = doc.page.margins.top;
    }
    const lineWidth = line.reduce((sum, f) => sum + f.width, 0);
    let cursor =
      x +
      (align === "center" ? (width - lineWidth) / 2 : align === "right" ? width - lineWidth : 0);
    for (const fragment of line) {
      doc
        .font(fragment.font)
        .fillColor(fragment.color)
        .text(fragment.text, cursor, top + ascent, { lineBreak: false, baseline: "alphabetic" });
      cursor += fragment.width;
    }
    if (underline && lineWidth) {
      const startX = cursor - lineWidth;
      doc
        .strokeColor(color)
        .lineWidth(1)
        .moveTo(startX, top + ascent + 3)
        .lineTo(cursor, top + ascent + 3)
        .stroke();
    }
    top += lineHeight;
  }

  doc.x = x;
  doc.y = top;
  return doc;
};

// pdfkit exposes openImage at runtime, but @types/pdfkit does not declare it
const openImage = (doc: PDFKit.PDFDocument, buffer: Buffer) =>
  (
    doc as PDFKit.PDFDocument & { openImage(src: Buffer): { width: number; height: number } }
  ).openImage(buffer);

// Fetch evidence images up front so the PDF can be written in one synchronous pass
const downloadImages = (urls: string[]): Promise<DownloadedImage[]> =>
  Promise.all(
    urls.map(async (imageUrl, index) => {
      const filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1).split("?")[0] ?? "";
      try {
        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { buffer: Buffer.from(await response.arrayBuffer()), index, filename };
      } catch (error) {
        console.error(
          `Failed to download image ${index + 1} from ${imageUrl}:`,
          error instanceof Error ? error.message : error,
        );
        return { buffer: null, index, filename: `${index + 1}` };
      }
    }),
  );

// --- Colour palette ---
const COLORS = {
  brand: "#0056b3", // BusWatch blue (main accent)
  accent: "#FF8C00", // orange highlight
  commend: "#12A150", // green accent for commendations
  text: "#333333",
  muted: "#666666",
  background: "#F8F9FA",
  border: "#E0E0E0",
  success: "#28A745",
};

/**
 * Generates the passenger's PDF receipt in their language: cover page, report details and
 * evidence images. Commendations get their own title and wording.
 */
export const generatePdfReceipt = async (reportData: ReceiptData): Promise<ReceiptResult> => {
  const imageResults = await downloadImages(reportData.images ?? []);
  const type = reportData.type ?? "complaint";
  const language = reportData.language ?? "en";
  const messages = messagesFor(language);
  const t = messages.pdf;

  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleString(DATE_LOCALES[language], {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Colombo",
    });

  return new Promise<ReceiptResult>((resolve, reject) => {
    // bufferPages lets us add page numbers once all content is written
    const doc = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });
    registerFonts(doc);
    const buffers: Buffer[] = [];

    const receiptId = reportData.receiptId || generateReceiptId();
    const formattedDate = formatDate(new Date());
    const accent = type === "commendation" ? COLORS.commend : COLORS.accent;

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve({ pdfBuffer: Buffer.concat(buffers), receiptId }));
    doc.on("error", reject);

    const addHorizontalRule = (y: number, color = COLORS.border, thickness = 0.5) => {
      doc
        .strokeColor(color)
        .lineWidth(thickness)
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.width - doc.page.margins.right, y)
        .stroke();
    };

    const heading = (text: string) => {
      writeText(doc, text, { size: 16, bold: true, color: COLORS.brand, underline: true });
      doc.y += 6;
    };

    // --- Cover page ---
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.background);
    doc.opacity(0.05).lineWidth(0.8).strokeColor(COLORS.brand);
    for (let i = -doc.page.height; i < doc.page.width * 2; i += 20) {
      doc
        .moveTo(i, 0)
        .lineTo(i + doc.page.height, doc.page.height)
        .stroke();
    }
    doc.opacity(1);

    const middle = doc.page.height / 2;
    const fullWidth = { x: 0, width: doc.page.width, align: "center" as const };
    writeText(doc, "BusWatch", {
      ...fullWidth,
      y: middle - 150,
      size: 36,
      bold: true,
      color: COLORS.brand,
    });
    writeText(doc, t.subtitle, { ...fullWidth, y: middle - 100, size: 18, color: COLORS.muted });

    const [titleTop, titleBottom] = t.title[type];
    writeText(doc, titleTop, { ...fullWidth, y: middle + 10, size: 44, bold: true });
    writeText(doc, titleBottom, { ...fullWidth, y: middle + 70, size: 44, bold: true });

    const titleLineY = middle + 160;
    doc
      .strokeColor(accent)
      .lineWidth(5)
      .moveTo(doc.page.width / 2 - 60, titleLineY)
      .lineTo(doc.page.width / 2 + 60, titleLineY)
      .stroke();

    // Text inside the bottom margin would otherwise start a new page
    doc.page.margins.bottom = 0;
    writeText(doc, `${t.reportId}: ${receiptId}`, {
      ...fullWidth,
      y: doc.page.height - 90,
      size: 12,
      color: COLORS.muted,
    });
    writeText(doc, `${t.date}: ${formattedDate}`, {
      ...fullWidth,
      y: doc.page.height - 68,
      size: 12,
      color: COLORS.muted,
    });

    // --- Details page ---
    doc.addPage({ margin: 50 });
    writeText(doc, t.detailsHeading[type], { size: 22, bold: true });
    doc.y += 4;
    addHorizontalRule(doc.y, COLORS.brand, 1.5);
    doc.y += 16;

    heading(t.summary);
    const summaryLine = (label: string, value: string) =>
      writeText(
        doc,
        [
          { text: `${label}: `, color: COLORS.muted },
          { text: value, bold: true },
        ],
        { size: 11 },
      );
    summaryLine(t.identifier, receiptId);
    summaryLine(t.generatedOn, formattedDate);
    doc.y += 20;

    heading(t.overview[type]);
    const detailRows = [
      { label: t.busNumber, value: reportData.busNumber || t.none },
      { label: t.routeNumber, value: reportData.routeNumber || t.none },
      { label: t.busName, value: reportData.busName || t.none },
      {
        label: t.category,
        value: reportData.category
          ? (messages.categories[reportData.category as keyof typeof messages.categories] ??
            reportData.category)
          : t.none,
      },
      { label: t.location, value: reportData.location || t.notSpecified },
      {
        label: t.incidentAt[type],
        value: reportData.incidentAt ? formatDate(reportData.incidentAt) : t.notSpecified,
      },
      { label: t.reportedOn, value: formatDate(reportData.reportedAt) },
    ];

    const tableX = doc.page.margins.left;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const labelWidth = 180;
    const valueX = tableX + labelWidth + 10;
    const valueWidth = tableWidth - labelWidth - 10;
    const paddingY = 4;

    for (const [i, row] of detailRows.entries()) {
      const label = {
        x: tableX + 6,
        width: labelWidth - 6,
        size: 11,
        color: COLORS.muted,
      } satisfies WriteOptions;
      const value = { x: valueX, width: valueWidth, size: 12, bold: true } satisfies WriteOptions;
      const rowHeight =
        Math.max(
          layoutText(doc, `${row.label}:`, label).height,
          layoutText(doc, row.value, value).height,
        ) +
        paddingY * 2;
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom)
        doc.addPage({ margin: 50 });
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(tableX, rowY, tableWidth, rowHeight).fill(COLORS.background);
      writeText(doc, `${row.label}:`, { ...label, y: rowY + paddingY });
      writeText(doc, row.value, { ...value, y: rowY + paddingY });
      doc.y = rowY + rowHeight;
    }

    // The description can be long, so it gets its own block under the table
    doc.y += 18;
    writeText(doc, `${t.description[type]}:`, { size: 11, color: COLORS.muted });
    doc.y += 4;
    writeText(doc, reportData.description || t.none, { size: 12, lineGap: 2 });
    doc.y += 16;

    // --- Evidence images ---
    const images = reportData.images ?? [];
    if (images.length > 0) {
      doc.addPage({ margin: 50 });
      heading(t.evidence);
      writeText(doc, t.evidenceCount(images.length), { size: 10, color: COLORS.muted });
      doc.y += 12;

      const contentWidth = doc.page.width - doc.page.margins.left * 2;
      const unavailable = (filename: string) => {
        writeText(doc, t.imageUnavailable(filename), {
          size: 10,
          color: COLORS.muted,
          align: "center",
        });
        doc.y += 10;
      };
      for (const { buffer, index, filename } of imageResults) {
        if (!buffer) {
          unavailable(filename);
          continue;
        }
        try {
          const img = openImage(doc, buffer);
          const maxWidth = contentWidth - 40;
          const maxHeight = 300;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          if (doc.y + height + 60 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage({ margin: 50 });
          }

          const x = doc.page.margins.left + (contentWidth - width) / 2;
          const imageY = doc.y;
          doc.image(buffer, x, imageY, { width, height });
          doc
            .rect(x - 2, imageY - 2, width + 4, height + 4)
            .lineWidth(1)
            .stroke(COLORS.border);
          doc.y = imageY + height + 8;
          writeText(doc, `${filename} (${index + 1}/${images.length})`, {
            size: 9,
            color: COLORS.muted,
            align: "center",
          });
          doc.y += 16;
        } catch (imgErr) {
          console.error(
            "Error embedding image:",
            imgErr instanceof Error ? imgErr.message : imgErr,
          );
          unavailable(filename);
        }
      }
    }

    // --- Footer --- (measured first so it is never split across pages)
    const centered = { align: "center" as const };
    const footer: [string, WriteOptions, number][] = [
      [t.submitted, { ...centered, size: 16, bold: true, color: COLORS.success }, 6],
      [t.thanks[type], { ...centered, size: 11, color: COLORS.muted, lineGap: 3 }, 12],
      [t.reference, { ...centered, size: 10, bold: true, color: COLORS.brand }, 0],
      [t.provideId(receiptId), { ...centered, size: 9 }, 0],
      [t.contact, { ...centered, size: 9 }, 0],
    ];
    const footerHeight =
      14 +
      footer.reduce(
        (sum, [text, options, gap]) => sum + layoutText(doc, text, options).height + gap,
        0,
      );
    if (doc.y + footerHeight > doc.page.height - doc.page.margins.bottom)
      doc.addPage({ margin: 50 });
    addHorizontalRule(doc.y, COLORS.border, 1);
    doc.y += 14;
    for (const [text, options, gap] of footer) {
      writeText(doc, text, options);
      doc.y += gap;
    }

    // --- Page numbers ---
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      writeText(doc, t.page(i + 1, pageCount), {
        x: doc.page.width - 200,
        y: doc.page.height - 32,
        width: 150,
        size: 8,
        color: COLORS.muted,
        align: "right",
      });
    }

    doc.end();
  });
};
