// Checks the SMTP settings: `npm run email:test` logs in without sending anything, and
// `npm run email:test -- you@example.com` also sends a test message there.
import {
  isEmailConfigured,
  sendTestEmail,
  verifyEmailConnection,
} from "../services/email.service.js";

const to = process.argv[2];

if (!isEmailConfigured()) {
  console.error("Email is not set up: fill in EMAIL_SERVICE_HOST and EMAIL_SERVICE_USER in .env.");
  process.exit(1);
}

try {
  await verifyEmailConnection();
  console.log("Logged in to the SMTP server.");
  if (to) {
    const info = await sendTestEmail(to);
    console.log(`Test email sent to ${to} (${info.messageId}).`);
  }
} catch (error) {
  console.error("Email check failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
