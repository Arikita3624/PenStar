import pool from "../db.js";

export const createBookingServiceLog = async (data) => {
  const { booking_service_id, action, action_by, note } = data;
  const res = await pool.query(
    `INSERT INTO booking_service_logs (booking_service_id, action, action_by, note) VALUES ($1, $2, $3, $4) RETURNING *`,
    [booking_service_id, action, action_by, note || null]
  );
  return res.rows[0];
};
