const PDFDocument = require("pdfkit");
const { v4: uuidv4 } = require("uuid"); // For unique receipt IDs

const generatePdfReceipt = async (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on("error", reject);

    const receiptId = uuidv4(); // Generate a unique receipt ID

    // Add Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("PTWatch Report Receipt", { align: "center" })
      .moveDown();

    // Add Receipt ID
    doc
      .fontSize(14)
      .font("Helvetica")
      .text(`Receipt ID: ${receiptId}`, { align: "right" })
      .moveDown(0.5);

    // Report Details
    doc.fontSize(16).text("Report Details:", { underline: true }).moveDown(0.5);
    doc.fontSize(12).text(`Bus Number: ${reportData.busNumber}`).moveDown(0.2);
    doc.text(`Route Number: ${reportData.routeNumber}`).moveDown(0.2);
    if (reportData.busName) {
      doc.text(`Bus Name: ${reportData.busName}`).moveDown(0.2);
    }
    doc.text(`Location of Incident: ${reportData.locationName}`).moveDown(0.2);
    doc
      .text(
        `Date & Time of Report: ${new Date(
          reportData.reportedAt
        ).toLocaleString()}`
      )
      .moveDown(0.5);

    doc.text("Description of Incident:", { underline: true }).moveDown(0.5);
    doc.text(reportData.description).moveDown(1);

    doc
      .fontSize(10)
      .text(
        "Thank you for your valuable contribution to improving public transport.",
        { align: "center" }
      );
    doc.text(
      "This receipt confirms your report has been submitted to PTWatch.",
      { align: "center" }
    );
    doc.moveDown(1);
    doc
      .fontSize(8)
      .text("For inquiries, please refer to your Receipt ID.", {
        align: "center",
      });

    doc.end();
    reportData.receiptId = receiptId; // Add receiptId to reportData for storage
  });
};

module.exports = { generatePdfReceipt };
