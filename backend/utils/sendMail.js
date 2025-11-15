import nodemailer from "nodemailer";

const sendMail = async (to, subject, html) => {
  try {
    const host = process.env.SMTP_HOST || "smtp.example.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || "user@example.com";
    const pass = process.env.SMTP_PASS || "password";
    const from = process.env.FROM_EMAIL || user;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("sendMail: messageId=", info.messageId);
    return true;
  } catch (err) {
    console.error("sendMail error:", err);
    return false;
  }
};

export default sendMail;