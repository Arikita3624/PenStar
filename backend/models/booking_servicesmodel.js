import pool from "../db.js";

export const getBookingServices = async () => {
  const res = await pool.query(
    "SELECT * FROM booking_services ORDER BY id DESC"
  );
  return res.rows;
};

export const getBookingServiceById = async (id) => {
  const res = await pool.query("SELECT * FROM booking_services WHERE id = $1", [
    id,
  ]);
  return res.rows[0];
};

export const createBookingService = async (data) => {
  const { booking_id, service_id, quantity, total_service_price } = data;
  const res = await pool.query(
    `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price) VALUES ($1,$2,$3,$4) RETURNING *`,
    [booking_id, service_id, quantity, total_service_price]
  );
  return res.rows[0];
};

export const deleteBookingService = async (id) => {
  const res = await pool.query(
    "DELETE FROM booking_services WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0];
};
