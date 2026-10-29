const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

/**
 * Generates a professional PDF receipt for a BusWatch report with a modern, light theme.
 *
 * @param {object} reportData - The data for the report.
 * @param {string} reportData.busNumber - The bus number.
 * @param {string} reportData.routeNumber - The route number.
 * @param {string} [reportData.busName] - The name of the bus (optional).
 * @param {string} reportData.location - The location of the incident.
 * @param {string} reportData.reportedAt - The timestamp of when the report was made.
 * @param {string} reportData.description - The description of the incident.
 * @param {string[]} [reportData.images] - An array of image URLs related to the report (optional).
 * @returns {Promise<{pdfBuffer: Buffer, receiptId: string}>} A promise that resolves with the PDF buffer and the generated receipt ID.
 */
const generatePdfReceipt = async (reportData) => {
  return new Promise(async (resolve, reject) => {
    // Initialize PDFDocument with A4 size and bufferPages for post-generation page numbering
    // The first page is created by default, so we'll use it for the cover.
    const doc = new PDFDocument({
      margin: 0, // Set initial margin to 0 for the cover page
      size: "A4",
      bufferPages: true, // Enable buffering pages for later manipulation (like adding page numbers)
    });
    const buffers = []; // Array to collect PDF data chunks

    const receiptId = uuidv4(); // Generate a unique receipt ID
    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Event listeners for PDF generation
    doc.on("data", buffers.push.bind(buffers)); // Collect data chunks
    doc.on("end", () => {
      // When document ends, concatenate buffers and resolve
      const pdfBuffer = Buffer.concat(buffers);
      resolve({ pdfBuffer, receiptId });
    });
    doc.on("error", reject); // Handle errors

    // --- Color Palette (Modern & Professional) ---
    const primaryBrandColor = "#0056b3"; // BusWatch Blue (main accent)
    const secondaryAccentColor = "#FF8C00"; // Vibrant Orange (secondary accent/highlight)
    const textColorPrimary = "#333333"; // Dark gray for main text
    const textColorSecondary = "#666666"; // Medium gray for subtext/labels
    const backgroundColorLight = "#F8F9FA"; // Very light gray for backgrounds
    const borderColorLight = "#E0E0E0"; // Light gray for borders/dividers
    const successColor = "#28A745"; // Green for success messages

    // --- Font Setup ---
    const fontPrimaryBold = "Helvetica-Bold";
    const fontPrimaryRegular = "Helvetica";
    const fontAccentItalic = "Helvetica-Oblique"; // Using Oblique for a subtle accent

    // --- Helper Function: Add Horizontal Rule ---
    const addHorizontalRule = (
      y,
      color = borderColorLight,
      thickness = 0.5,
      indent = 0
    ) => {
      doc
        .strokeColor(color)
        .lineWidth(thickness)
        .moveTo(doc.page.margins.left + indent, y)
        .lineTo(doc.page.width - doc.page.margins.right - indent, y)
        .stroke();
    };

    // --- Cover Page ---
    // Background with subtle pattern
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(backgroundColorLight);

    // Subtle diagonal lines pattern
    doc.opacity(0.05).lineWidth(0.8).strokeColor(primaryBrandColor);
    for (let i = -doc.page.height; i < doc.page.width * 2; i += 20) {
      doc
        .moveTo(i, 0)
        .lineTo(i + doc.page.height, doc.page.height)
        .stroke();
    }
    doc.opacity(1); // Reset opacity

    // Header: BusWatch Logo/Name
    doc
      .fillColor(primaryBrandColor)
      .fontSize(36)
      .font(fontPrimaryBold)
      .text("BusWatch", 0, doc.page.height / 2 - 150, { align: "center" });

    doc
      .fillColor(textColorSecondary)
      .fontSize(18)
      .font(fontAccentItalic)
      .text(
        "Public Transport Monitoring System",
        0,
        doc.page.height / 2 - 100,
        { align: "center" }
      );

    // Main Title: Incident Report
    doc
      .fillColor(textColorPrimary)
      .fontSize(48)
      .font(fontPrimaryBold)
      .text("INCIDENT", 0, doc.page.height / 2 + 20, { align: "center" });
    doc
      .fontSize(56)
      .text("REPORT", 0, doc.page.height / 2 + 80, { align: "center" });

    // Decorative accent line below title
    const titleLineY = doc.page.height / 2 + 150;
    doc
      .strokeColor(secondaryAccentColor)
      .lineWidth(5)
      .moveTo(doc.page.width / 2 - 60, titleLineY)
      .lineTo(doc.page.width / 2 + 60, titleLineY)
      .stroke();

    // Report ID and Date on cover
    doc
      .fillColor(textColorSecondary)
      .fontSize(12)
      .font(fontPrimaryRegular)
      .text(`Report ID: ${receiptId}`, 0, doc.page.height - 80, {
        align: "center",
      });
    doc.text(`Date: ${formattedDate}`, 0, doc.page.height - 60, {
      align: "center",
    });

    // Add new page for main content with standard margins
    doc.addPage({ margin: 50 });

    // --- Main Content Header ---
    doc
      .fillColor(textColorPrimary)
      .fontSize(22)
      .font(fontPrimaryBold)
      .text("Incident Report Details", { align: "left" })
      .moveDown(0.5);

    addHorizontalRule(doc.y, primaryBrandColor, 1.5); // Thicker rule for main header
    doc.moveDown(1);

    // --- Report Summary Section ---
    doc
      .fillColor(primaryBrandColor)
      .fontSize(16)
      .font(fontPrimaryBold)
      .text("Report Summary", { underline: true })
      .moveDown(0.5);

    doc
      .fillColor(textColorSecondary)
      .fontSize(11)
      .font(fontPrimaryRegular)
      .text(`Unique Report Identifier: `, { continued: true })
      .fillColor(textColorPrimary)
      .font(fontPrimaryBold)
      .text(receiptId)
      .moveDown(0.2);

    doc
      .fillColor(textColorSecondary)
      .font(fontPrimaryRegular)
      .text(`Report Generated On: `, { continued: true })
      .fillColor(textColorPrimary)
      .font(fontPrimaryBold)
      .text(formattedDate)
      .moveDown(1.5);

    // --- Incident Details Section ---
    doc
      .fillColor(primaryBrandColor)
      .fontSize(16)
      .font(fontPrimaryBold)
      .text("Incident Overview", { underline: true })
      .moveDown(0.5);

    const detailRows = [
      { label: "Bus Number", value: reportData.busNumber || "N/A" },
      { label: "Route Number", value: reportData.routeNumber || "N/A" },
      { label: "Bus Name", value: reportData.busName || "N/A" },
      { label: "Location of Incident", value: reportData.location || "N/A" },
      {
        label: "Date & Time of Incident",
        value: new Date(reportData.reportedAt).toLocaleString() || "N/A",
      },
      // Detailed Description of Incident is now part of the detailRows
      { label: "Detailed Description", value: reportData.description || "N/A" },
    ];

    const detailTableX = doc.page.margins.left;
    const labelColumnWidth = 180; // Increased width to accommodate longer labels
    const valueColumnX = detailTableX + labelColumnWidth + 10; // Fixed gap of 10 points after label column
    const actualRowHeight = 28; // This is the total height of each row, including padding
    const paddingY = 5; // Vertical padding within each row to center text

    // Set the starting Y position for the table
    let currentTableY = doc.y;

    detailRows.forEach((row, i) => {
      const rowY = currentTableY + i * actualRowHeight;

      // Alternating row background for readability
      if (i % 2 === 0) {
        doc
          .rect(
            detailTableX,
            rowY, // Start rect at rowY
            doc.page.width - doc.page.margins.left * 2,
            actualRowHeight
          )
          .fill(backgroundColorLight);
      }

      doc
        .fillColor(textColorSecondary)
        .fontSize(11)
        .font(fontPrimaryRegular)
        .text(row.label + ":", detailTableX, rowY + paddingY, {
          // Label starts at detailTableX, left-aligned
          width: labelColumnWidth,
          align: "left", // Left-align label within its column
        });

      doc
        .fillColor(textColorPrimary)
        .fontSize(12)
        .font(fontPrimaryBold)
        .text(row.value, valueColumnX, rowY + paddingY); // Value starts at fixed position
    });

    doc.y = currentTableY + detailRows.length * actualRowHeight + 20; // Update Y position after table

    doc.addPage({ margin: 50 });
    // --- Images Section ---
    if (reportData.images && reportData.images.length > 0) {
      // Estimate height needed for the images section heading and first image.
      const estimatedImageSectionInitialHeight =
        16 + 0.8 * 16 + 10 + 1 * 10 + 300 + 9 + 1.5 * 9 + 60;
      if (
        doc.y + estimatedImageSectionInitialHeight >
        doc.page.height - doc.page.margins.bottom
      ) {
        doc.addPage(); // Add a new page only if necessary
      }

      doc
        .fillColor(primaryBrandColor)
        .fontSize(16)
        .font(fontPrimaryBold)
        .text("Attached Evidence ", { underline: true })
        .moveDown(0.5);

      doc
        .fillColor(textColorSecondary)
        .fontSize(10)
        .font(fontPrimaryRegular)
        .text(
          `Total ${reportData.images.length} image(s) attached to this report:`
        )
        .moveDown(1);

      const imagePromises = reportData.images.map(async (imageUrl, index) => {
        try {
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });
          const filename = imageUrl
            .substring(imageUrl.lastIndexOf("/") + 1)
            .split("?")[0];
          return { buffer: Buffer.from(response.data), index, filename };
        } catch (error) {
          console.error(
            `Failed to download image ${index + 1} from ${imageUrl}:`,
            error.message
          );
          return {
            buffer: null,
            index,
            filename: `Image ${index + 1} (Failed)`,
          };
        }
      });

      const imageResults = await Promise.all(imagePromises);

      for (const { buffer, index, filename } of imageResults) {
        if (buffer) {
          try {
            const img = doc.openImage(buffer);
            const maxWidth = doc.page.width - doc.page.margins.left * 2 - 40; // Content width minus padding
            const maxHeight = 300; // Max height for an image

            let width = img.width;
            let height = img.height;

            // Scale down if needed, maintaining aspect ratio
            if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height = height * ratio;
            }
            if (height > maxHeight) {
              const ratio = maxHeight / height;
              height = maxHeight;
              width = width * ratio;
            }

            // Check if we need a new page for the image and its caption
            // 60 is approximate space for caption + padding
            if (
              doc.y + height + 60 >
              doc.page.height - doc.page.margins.bottom
            ) {
              doc.addPage();
              doc.y = doc.page.margins.top; // Reset Y to top margin
            }

            // Center the image
            const x =
              doc.page.margins.left +
              (doc.page.width - doc.page.margins.left * 2 - width) / 2;
            const imageY = doc.y;

            // Add image
            doc.image(buffer, x, imageY, { width, height });
            doc.y += height + 8; // Space after image

            // Add border around the image
            doc
              .rect(x - 2, imageY - 2, width + 4, height + 4)
              .stroke(borderColorLight)
              .lineWidth(1);

            // Image caption (now explicitly centered using x and width)
            doc
              .fillColor(textColorSecondary)
              .fontSize(9)
              .font(fontAccentItalic)
              .text(
                `${filename} (Image ${index + 1} of ${
                  reportData.images.length
                })`,
                doc.page.margins.left, // Start at left margin
                doc.y,
                {
                  width: doc.page.width - doc.page.margins.left * 2, // Span full content width
                  align: "center",
                }
              )
              .moveDown(1.5); // Space after caption
          } catch (imgErr) {
            console.error("Error embedding image:", imgErr.message);
            doc
              .fillColor(textColorSecondary)
              .fontSize(10)
              .text(`[Failed to display image: ${filename}]`, {
                align: "center",
              })
              .moveDown(1);
          }
        } else {
          doc
            .fillColor(textColorSecondary)
            .fontSize(10)
            .text(`[Image ${filename} unavailable or failed to download]`, {
              align: "center",
            })
            .moveDown(1);
        }
      }
    }

    // --- Footer Section ---
    // Ensure footer is placed correctly, add a new page if content is too long
    // Estimate footer height (Thank you message, contact info, padding)
    const estimatedFooterHeight =
      16 + 0.5 * 16 + 11 + 1 * 11 + 10 + 0.3 * 10 + 9 + 0.2 * 9 + 9 + 50; // Roughly 150 points
    if (
      doc.y + estimatedFooterHeight >
      doc.page.height - doc.page.margins.bottom
    ) {
      doc.addPage();
    }

    addHorizontalRule(doc.y, borderColorLight, 1, 0); // Rule across full content width
    doc.moveDown(1);

    // Thank you section
    doc
      .fillColor(successColor)
      .fontSize(16)
      .font(fontPrimaryBold)
      .text("Report Successfully Submitted", { align: "center" })
      .moveDown(0.5);

    doc
      .fillColor(textColorSecondary)
      .fontSize(11)
      .font(fontPrimaryRegular)
      .text(
        "Thank you for contributing to safer public transportation. Your report has been recorded and will be reviewed by our team.",
        {
          align: "center",
          lineGap: 5,
        }
      )
      .moveDown(1);

    // Contact info
    doc
      .fillColor(primaryBrandColor)
      .fontSize(10)
      .font(fontPrimaryBold)
      .text("Need to reference this report?", { align: "center" })
      .moveDown(0.3);

    doc
      .fillColor(textColorPrimary)
      .fontSize(9)
      .font(fontPrimaryRegular)
      .text(`Please provide this Report ID: ${receiptId}`, {
        align: "center",
      })
      .moveDown(0.2);

    doc.text("For follow-up inquiries, contact support@buswatch.example.com", {
      align: "center",
    });

    // --- Page Numbers (Applied after all content is generated) ---
    const pageCount = doc.bufferedPageRange().count;
    const pageNumberY = doc.page.height - 25; // Position from bottom edge
    const pageNumberX = doc.page.width - doc.page.margins.right; // Right alignment

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i); // Switch to the current page to add the number
      doc
        .fillColor(textColorSecondary)
        .fontSize(8)
        .font(fontPrimaryRegular)
        .text(
          `Page ${i + 1} of ${pageCount}`,
          pageNumberX, // X position
          pageNumberY, // Y position
          { align: "right" }
        );
    }

    // Finalize the PDF document
    doc.end();
  });
};

module.exports = generatePdfReceipt;
