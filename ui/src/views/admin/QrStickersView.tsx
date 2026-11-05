"use client";

import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import {
  Alert,
  Box,
  Button,
  Card,
  GlobalStyles,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrandMark, QrCode } from "@/components/atoms";
import { EmptyState, PageHeader, SectionPanel } from "@/components/molecules";
import useIsClient from "@/hooks/useIsClient";
import { parseBusNumber, parseRoute, qrShortPath } from "@/lib/busNumber";

// The sticker speaks all three languages: passengers scan it before choosing one on the site
const CALL_TO_ACTION = [
  { lang: "en", text: "Problem on this bus? Or a great crew? Scan to tell us." },
  { lang: "si", text: "මෙම බස් රථයේ ගැටලුවක්ද? නැතහොත් හොඳ සේවාවක්ද? ස්කෑන් කර අපට කියන්න." },
  {
    lang: "ta",
    text: "இந்தப் பேருந்தில் பிரச்சினையா? அல்லது சிறந்த சேவையா? ஸ்கேன் செய்து எங்களிடம் சொல்லுங்கள்.",
  },
] as const;

const LAYOUTS = {
  large: { label: "Large: 2 per A4 page", columns: 1, qr: "62mm", height: "132mm" },
  small: { label: "Small: 6 per A4 page", columns: 2, qr: "42mm", height: "88mm" },
} as const;
type Layout = keyof typeof LAYOUTS;

interface StickerLine {
  bus: string;
  route: string;
}

/** "NB-1234, 08" per line → bus and optional route; returns the lines it could not read. */
const parseLines = (text: string) => {
  const stickers: StickerLine[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const [busPart = "", ...routeParts] = line.split(",");
    const bus = parseBusNumber(busPart);
    if (!bus) {
      invalid.push(line);
      continue;
    }
    const route = parseRoute(routeParts.join(","));
    const key = `${bus}|${route}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stickers.push({ bus, route });
  }
  return { stickers, invalid };
};

function Sticker({ bus, route, origin, layout }: StickerLine & { origin: string; layout: Layout }) {
  const size = LAYOUTS[layout];
  const url = `${origin}${qrShortPath(bus, route)}`;
  const shortUrl = url.replace(/^https?:\/\//, "");
  const large = layout === "large";

  return (
    <Box
      sx={{
        height: size.height,
        p: large ? "8mm" : "5mm",
        border: "1px dashed #9AA3B8", // cut line
        borderRadius: "4mm",
        bgcolor: "#fff",
        color: "#0B1220",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        textAlign: "center",
        breakInside: "avoid",
        pageBreakInside: "avoid",
        // Print the brand colours even when "background graphics" is off
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        {/* Stickers are always white; keep the wordmark dark even in the console's dark mode */}
        <Box
          sx={{
            "& .MuiTypography-root": { color: "#0B1220" },
            "& .MuiTypography-root span": { color: "#2457F5" },
          }}
        >
          <BrandMark size={large ? 30 : 22} />
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: large ? "9pt" : "7pt", color: "#5B6478", lineHeight: 1.2 }}>
            Bus · බස් · பேருந்து
          </Typography>
          <Typography
            sx={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 800,
              fontSize: large ? "20pt" : "13pt",
              lineHeight: 1.1,
            }}
          >
            {bus}
          </Typography>
          {route && (
            <Typography sx={{ fontSize: large ? "10pt" : "7.5pt", fontWeight: 600 }}>
              Route {route}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ p: large ? "3mm" : "2mm", borderRadius: "3mm", border: "2px solid #2457F5" }}>
        <QrCode value={url} size={size.qr} title={`QR code for bus ${bus}`} />
      </Box>

      <Box sx={{ display: "grid", gap: large ? "1.5mm" : "0.8mm" }}>
        {CALL_TO_ACTION.map((line) => (
          <Typography
            key={line.lang}
            lang={line.lang}
            sx={{
              fontSize: large ? (line.lang === "en" ? "12pt" : "10.5pt") : "7.5pt",
              fontWeight: line.lang === "en" ? 800 : 600,
              lineHeight: 1.35,
            }}
          >
            {line.text}
          </Typography>
        ))}
        <Typography
          sx={{
            mt: large ? "1mm" : "0.5mm",
            fontSize: large ? "9pt" : "6.5pt",
            color: "#5B6478",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {shortUrl}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Printable QR stickers for the inside of buses. Scanning one opens the report form with the
 * bus number filled in (via the /r/<bus> short link) and counts the report as "from a QR code".
 */
function QrStickersView() {
  const searchParams = useSearchParams();
  const isClient = useIsClient();
  const initialBus = parseBusNumber(searchParams.get("bus"));
  const initialRoute = parseRoute(searchParams.get("route"));
  const [text, setText] = useState(
    initialBus ? `${initialBus}${initialRoute ? `, ${initialRoute}` : ""}` : "",
  );
  const [layout, setLayout] = useState<Layout>("large");
  const { stickers, invalid } = parseLines(text);
  const origin = isClient ? window.location.origin : "";

  return (
    <>
      <GlobalStyles styles={{ "@page": { size: "A4", margin: "10mm" } }} />
      <Box sx={{ displayPrint: "none" }}>
        <PageHeader
          eyebrow="Spread the word"
          title="QR stickers"
          subtitle="Print a sticker for the inside of each bus. Scanning it opens the report form with the bus number already filled in."
          actions={
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              disabled={stickers.length === 0}
            >
              Print {stickers.length > 0 ? `${stickers.length} ` : ""}sticker
              {stickers.length === 1 ? "" : "s"}
            </Button>
          }
        />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <SectionPanel
              title="Buses"
              subtitle="One bus per line. Add the route after a comma to print it too."
              icon={<QrCode2RoundedIcon fontSize="small" />}
            >
              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Bus numbers"
                placeholder={"NB-1234, 08\nNE-4521, Colombo–Matale\n62-1182"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                slotProps={{
                  htmlInput: { style: { fontFamily: "ui-monospace, monospace" } },
                }}
              />
              {invalid.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Skipped {invalid.length === 1 ? "a line that isn't" : "lines that aren't"} a bus
                  number: {invalid.join(" · ")}
                </Alert>
              )}
            </SectionPanel>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionPanel title="Print settings" icon={<PrintRoundedIcon fontSize="small" />}>
              <TextField
                select
                fullWidth
                label="Sticker size"
                value={layout}
                onChange={(e) => setLayout(e.target.value as Layout)}
              >
                {Object.entries(LAYOUTS).map(([value, option]) => (
                  <MenuItem key={value} value={value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Print at 100% scale on A4 and cut along the dashed lines. Weatherproof vinyl lasts
                longest inside a bus. Each code links to{" "}
                <Box component="code" sx={{ fontSize: "0.85em" }}>
                  {origin || "this site"}/r/&lt;bus&gt;
                </Box>
                , so stickers keep working if the form changes.
              </Typography>
            </SectionPanel>
          </Grid>
        </Grid>
      </Box>

      {stickers.length === 0 ? (
        <Card sx={{ displayPrint: "none" }}>
          <EmptyState
            icon={<QrCode2RoundedIcon />}
            title="No stickers yet"
            description="Enter one or more bus numbers above to preview their stickers."
          />
        </Card>
      ) : (
        isClient && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: `repeat(${LAYOUTS[layout].columns}, minmax(0, ${layout === "large" ? "150mm" : "1fr"}))`,
              },
              gap: "6mm",
              justifyContent: "center",
              "@media print": {
                gridTemplateColumns: `repeat(${LAYOUTS[layout].columns}, 1fr)`,
                gap: "5mm",
              },
            }}
          >
            {stickers.map((s) => (
              <Sticker key={`${s.bus}|${s.route}`} {...s} origin={origin} layout={layout} />
            ))}
          </Box>
        )
      )}
    </>
  );
}

export default QrStickersView;
