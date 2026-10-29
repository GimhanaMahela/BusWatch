const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE_HOST,
  port: process.env.EMAIL_SERVICE_PORT,
  secure: false, // Use 'false' for STARTTLS on port 587
  auth: {
    user: process.env.EMAIL_SERVICE_USER,
    pass: process.env.EMAIL_SERVICE_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Essential for Ethereal, remove for production with trusted CAs
  },
});

const sendReportReceiptEmail = async (toEmail, receiptPdfBuffer, receiptId) => {
  try {
    const mailOptions = {
      from: `BusWatch <${process.env.EMAIL_SERVICE_USER}>`, // More friendly sender name
      to: toEmail,
      subject: `Your BusWatch Report Receipt - ID: ${receiptId}`, // Clearer subject
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding-bottom: 20px; text-align: center;">
                        <h1 style="color: #0056b3; margin: 0; font-size: 28px;">BusWatch</h1>
                        <p style="color: #555; font-size: 14px; margin-top: 5px;">Your Eye on Public Transport</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px;">
                        <h2 style="font-size: 20px; color: #333; margin-top: 0;">Hi there!</h2>
                        <p style="font-size: 16px;">Thank you for taking the time to report an issue with public transport. Your vigilance helps us make a real difference!</p>
                        <p style="font-size: 16px;">We've successfully received your report. For your records, please find your official **report receipt attached** to this email.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-bottom: 20px; text-align: center;">
                        <div style="background-color: #e0f2f7; padding: 15px; border-radius: 5px; display: inline-block;">
                            <p style="font-size: 18px; font-weight: bold; color: #0056b3; margin: 0;">Your Report ID:</p>
                            <p style="font-size: 24px; font-weight: bold; color: #0056b3; margin: 5px 0 0;">${receiptId}</p>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 10px; padding-bottom: 20px; font-size: 15px; color: #555;">
                        <p>This unique ID helps us track and investigate your report efficiently. We truly appreciate your cooperation in contributing to a better public transport system.</p>
                        <p>If you have any further questions or need to refer to this report, please use the Report ID provided above.</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding-top: 20px; text-align: center; border-top: 1px solid #eee;">
                        <p style="font-size: 14px; color: #777;">Sincerely,<br/>The **BusWatch Team**</p>
                        <p style="font-size: 12px; color: #999; margin-top: 15px;">&copy; ${new Date().getFullYear()} BusWatch. All rights reserved.</p>
                        <p style="font-size: 12px; color: #999;">Visit us at [Your Website Link Here]</p>
                    </td>
                </tr>
            </table>
        </div>
      `,
      attachments: [
        {
          filename: `BusWatch_Report_Receipt_${receiptId}.pdf`,
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
