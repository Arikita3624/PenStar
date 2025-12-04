import nodemailer from "nodemailer";
import { bookingConfirmationTemplate } from "../email_templates/bookingConfirmationTemplate.js";
import pool from "../db.js";

// Read SMTP configuration from env variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "nguyenduyhung3624@gmail.com",
    pass: process.env.SMTP_PASS || "szcg bmqi ptaq npgk",
  },
});

export const sendBookingConfirmationEmail = async (
  to,
  bookingId,
  emailHtml = null
) => {
  if (!to) throw new Error("Missing recipient email");
  // fetch booking with items and services
  const bookingRes = await pool.query(
    "SELECT b.*, ss.name as stay_status_name, u.email, u.phone FROM bookings b LEFT JOIN stay_status ss ON ss.id = b.stay_status_id LEFT JOIN users u ON u.id = b.user_id WHERE b.id = $1",
    [bookingId]
  );
  const booking = bookingRes.rows[0];
  if (!booking || booking.payment_status !== "paid") {
    // Chỉ gửi mail khi đã thanh toán thành công
    return;
  }
  const itemsRes = await pool.query(
    `SELECT bi.id, r.name as room_name, bi.check_in, bi.check_out
     FROM booking_items bi
     JOIN rooms r ON bi.room_id = r.id
     WHERE bi.booking_id = $1`,
    [bookingId]
  );
  const servicesRes = await pool.query(
    "SELECT * FROM booking_services WHERE booking_id = $1",
    [bookingId]
  );
  booking.items = itemsRes.rows;
  booking.services = servicesRes.rows;

  // Ưu tiên dùng emailHtml từ frontend nếu có, nếu không thì dùng template cũ
  const html = emailHtml || bookingConfirmationTemplate(booking);

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Xác nhận đặt phòng PenStar #${booking.id}`,
    html,
  });
};

export default transporter;
