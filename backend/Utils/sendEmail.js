const nodemailer = require("nodemailer");

console.log("📧 Email config:", {
  service: "gmail",
  user: process.env.EMAIL_USER ? "configured ✅" : "missing ❌",
  pass: process.env.EMAIL_PASS ? "configured ✅" : "missing ❌"
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter is ready");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log(`📤 Attempting to send email to ${to}...`);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    console.error("Error details:", error);
    throw error;
  }
};

module.exports = sendEmail;
