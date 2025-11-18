import nodemailer from "nodemailer";

const send = async (to, subject, html) => {

  try {
    const host = process.env.SMTP_HOST || "smtp.example.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.EMAIL_USER || "user@example.com";
    const pass = process.env.EMAIL_PASS || "password";
    const from = process.env.EMAIL_USER || user;

    console.log("Connecting to SMTP:", { host, port, user });
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
    console.log("to", to);
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

export default send;