const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios"); // We'll use axios to download images from URLs

const generatePdfReceipt = async (reportData) => {
  return new Promise(async (resolve, reject) => {
    // Make the Promise async
    const doc = new PDFDocument({ margin: 72 });
    const buffers = [];

    const receiptId = uuidv4();

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve({ pdfBuffer, receiptId });
    });
    doc.on("error", reject);

    // Define some colors for consistency
    const primaryColor = "#0056b3"; // BusWatch Blue
    const accentColor = "#333333"; // Darker text for readability
    const lightGray = "#f0f0f0"; // For background elements
    const mediumGray = "#666666"; // For less critical text

    // --- Header Section ---
    doc
      .fillColor(primaryColor)
      .fontSize(30)
      .font("Helvetica-Bold")
      .text("BusWatch", { align: "center" })
      .moveDown(0.5);

    doc
      .fillColor(mediumGray)
      .fontSize(14)
      .font("Helvetica-Oblique")
      .text("Your Eye on Public Transport - Report Receipt", {
        align: "center",
      })
      .moveDown(1.5);

    // --- Receipt ID Box ---
    const receiptIdBoxHeight = 50;
    const receiptIdBoxY = doc.y;
    doc
      .rect(
        doc.x,
        receiptIdBoxY - 10,
        doc.page.width - doc.x * 2,
        receiptIdBoxHeight
      )
      .fill(lightGray);

    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Receipt ID:", doc.x + 10, receiptIdBoxY + 5)
      .fillColor(accentColor)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(receiptId, doc.x + 10, receiptIdBoxY + 25)
      .moveDown(2);

    // --- Report Details Section ---
    doc
      .fillColor(accentColor)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Report Details", { underline: true })
      .moveDown(0.8);

    doc.fillColor(accentColor).fontSize(12).font("Helvetica");

    const detailIndent = 20;
    doc
      .text(`Bus Number:`, { continued: true, indent: detailIndent })
      .font("Helvetica-Bold")
      .text(`${reportData.busNumber}`)
      .moveDown(0.2);

    doc
      .font("Helvetica")
      .text(`Route Number:`, { continued: true, indent: detailIndent })
      .font("Helvetica-Bold")
      .text(`${reportData.routeNumber}`)
      .moveDown(0.2);

    if (reportData.busName) {
      doc
        .font("Helvetica")
        .text(`Bus Name:`, { continued: true, indent: detailIndent })
        .font("Helvetica-Bold")
        .text(`${reportData.busName}`)
        .moveDown(0.2);
    }

    doc
      .font("Helvetica")
      .text(`Location of Incident:`, { continued: true, indent: detailIndent })
      .font("Helvetica-Bold")
      .text(`${reportData.location}`)
      .moveDown(0.2);

    doc
      .font("Helvetica")
      .text(`Date & Time of Report:`, { continued: true, indent: detailIndent })
      .font("Helvetica-Bold")
      .text(`${new Date(reportData.reportedAt).toLocaleString()}`)
      .moveDown(1);

    // --- Description Section ---
    doc
      .fillColor(accentColor)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Description of Incident:", { underline: true })
      .moveDown(0.5);

    doc
      .fillColor(mediumGray)
      .fontSize(12)
      .font("Helvetica")
      .text(reportData.description, {
        align: "left",
      })
      .moveDown(1.5);

    // --- Images Section ---
    if (reportData.images && reportData.images.length > 0) {
      doc.addPage(); // Start a new page for images for better layout
      doc
        .fillColor(accentColor)
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("Attached Images:", { underline: true })
        .moveDown(0.8);

      const imagePromises = reportData.images.map(async (imageUrl) => {
        try {
          const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
          });
          return Buffer.from(response.data);
        } catch (error) {
          console.error(
            `Failed to download image from ${imageUrl}:`,
            error.message
          );
          return null; // Return null for failed downloads
        }
      });

      const imageBuffers = await Promise.all(imagePromises);

      const maxImageWidth = doc.page.width - doc.x * 2; // Full width of the content area
      const maxImageHeight = 200; // Max height for an image to fit on a page

      for (const buffer of imageBuffers) {
        if (buffer) {
          // Only attempt to add if download was successful
          try {
            // Get image dimensions to calculate proper scaling
            const img = doc.openImage(buffer);
            let imgWidth = img.width;
            let imgHeight = img.height;

            // Calculate scaling factor
            if (imgWidth > maxImageWidth) {
              imgHeight = (imgHeight * maxImageWidth) / imgWidth;
              imgWidth = maxImageWidth;
            }
            if (imgHeight > maxImageHeight) {
              // Scale down further if height exceeds limit
              imgWidth = (imgWidth * maxImageHeight) / imgHeight;
              imgHeight = maxImageHeight;
            }

            // Check if adding image will overflow current page, if so add new page
            if (
              doc.y + imgHeight + 20 >
              doc.page.height - doc.page.margins.bottom
            ) {
              doc.addPage();
            }

            doc
              .image(buffer, {
                fit: [imgWidth, imgHeight], // Use calculated fit
                align: "center",
                valign: "center",
              })
              .moveDown(0.5); // Add some space after the image
          } catch (imgErr) {
            console.error("Error embedding image in PDF:", imgErr.message);
            doc
              .text("[Image failed to load]", { align: "center" })
              .moveDown(0.5);
          }
        }
      }
      doc.moveDown(1); // Space after all images
    }
    // --- End Images Section ---

    // --- Footer Section ---
    // Ensure footer is placed correctly after dynamic content like images
    // If the current position is too close to bottom, add a new page
    if (doc.y + 100 > doc.page.height - doc.page.margins.bottom) {
      // 100 is approx height of footer
      doc.addPage();
    }

    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Thank You for Your Contribution!", { align: "center" })
      .moveDown(0.5);

    doc
      .fillColor(mediumGray)
      .fontSize(10)
      .font("Helvetica")
      .text(
        "This receipt confirms your report has been successfully submitted to BusWatch.",
        { align: "center" }
      )
      .moveDown(0.2);

    doc
      .text(
        "Your valuable input helps us improve public transport for everyone.",
        { align: "center" }
      )
      .moveDown(0.8);

    doc
      .fillColor(mediumGray)
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text("For inquiries, please refer to your unique Report ID above.", {
        align: "center",
      });

    // Optional: Add a page number at the bottom if the content spans multiple pages
    // Note: This needs to be handled carefully with dynamic content.
    // For simplicity, removed the fixed "Page 1 of 1" and added a generic page number.
    doc.on("pageAdded", () => {
      doc.text(
        `Page ${doc.page.count}`,
        doc.page.width - 50,
        doc.page.height - 20,
        { align: "right" }
      );
    });

    // Finalize the PDF
    doc.end();
  });
};

module.exports = generatePdfReceipt;
