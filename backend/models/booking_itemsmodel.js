import pool from "../db.js";

export const getBookingItems = async () => {
  const res = await pool.query("SELECT * FROM booking_items ORDER BY id DESC");
  return res.rows;
};

export const getBookingItemById = async (id) => {
  const res = await pool.query("SELECT * FROM booking_items WHERE id = $1", [
    id,
  ]);
  return res.rows[0];
};

export const createBookingItem = async (data) => {
  const {
    booking_id,
    room_id,
    room_type_id,
    check_in,
    check_out,
    room_type_price,
  } = data;
  const res = await pool.query(
    `INSERT INTO booking_items (booking_id, room_id, room_type_id, check_in, check_out, room_type_price) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [booking_id, room_id, room_type_id, check_in, check_out, room_type_price]
  );
  return res.rows[0];
};

export const deleteBookingItem = async (id) => {
  const res = await pool.query(
    "DELETE FROM booking_items WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0];
};
