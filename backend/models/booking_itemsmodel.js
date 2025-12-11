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
    extra_adult_fees = 0,
    extra_child_fees = 0,
    extra_fees = 0,
    quantity = 1,
    num_adults = 0,
    num_children = 0,
    num_babies = 0,
  } = data;
  const res = await pool.query(
    `INSERT INTO booking_items (
      booking_id, room_id, room_type_id, check_in, check_out, room_type_price,
      extra_adult_fees, extra_child_fees, extra_fees, quantity,
      num_adults, num_children, num_babies
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13
    ) RETURNING *`,
    [
      booking_id,
      room_id,
      room_type_id,
      check_in,
      check_out,
      room_type_price,
      extra_adult_fees,
      extra_child_fees,
      extra_fees,
      quantity,
      num_adults,
      num_children,
      num_babies,
    ]
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
