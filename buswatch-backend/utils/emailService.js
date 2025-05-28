const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'outlook'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReportReceiptEmail = async (toEmail, receiptPdfBuffer, receiptId) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: `PTWatch Report Receipt - ID: ${receiptId}`,
      html: `
                <p>Dear Passenger,</p>
                <p>Thank you for reporting unethical behavior. Please find your report receipt attached.</p>
                <p>Your Report ID: <strong>${receiptId}</strong></p>
                <p>This will help us track and investigate your report. We appreciate your cooperation in making public transport better.</p>
                <p>Sincerely,<br/>The PTWatch Team</p>
            `,
      attachments: [
        {
          filename: `PTWatch_Report_Receipt_${receiptId}.pdf`,
          content: receiptPdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };
    await transporter.sendMail(mailOptions);
    console.log("Receipt email sent successfully!");
  } catch (error) {
    console.error("Error sending receipt email:", error);
    throw error; // Re-throw to handle in the calling function
  }
};

module.exports = { sendReportReceiptEmail };
