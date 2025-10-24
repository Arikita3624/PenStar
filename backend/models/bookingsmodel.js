import pool from "../db.js";

export const getBookings = async () => {
  const resuit = await pool.query(
    "SELECT * FROM bookings ORDER BY created_at DESC"
  );
  return resuit.rows;
};

export const getBookingById = async (id) => {
  const resuit = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return resuit.rows[0];
};

export const createBooking = async (data) => {
  // data: { customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, items: [{room_id, check_in, check_out, room_price}], services: [{service_id, quantity, total_service_price}] }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const {
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
    } = data;

    const insertBookingText = `INSERT INTO bookings (customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`;
    const bookingRes = await client.query(insertBookingText, [
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
    ]);
    const booking = bookingRes.rows[0];

    // insert booking_items if provided
    if (Array.isArray(data.items)) {
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, check_in, check_out, room_price) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      for (const item of data.items) {
        const { room_id, check_in, check_out, room_price } = item;
        await client.query(insertItemText, [
          booking.id,
          room_id,
          check_in,
          check_out,
          room_price,
        ]);
      }
    }

    // insert booking_services if provided
    if (Array.isArray(data.services)) {
      const insertServiceText = `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price) VALUES ($1, $2, $3, $4) RETURNING *`;
      for (const s of data.services) {
        const { service_id, quantity, total_service_price } = s;
        await client.query(insertServiceText, [
          booking.id,
          service_id,
          quantity,
          total_service_price,
        ]);
      }
    }

    await client.query("COMMIT");
    return booking;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateBookingStatus = async (id, fields) => {
  // fields: { payment_status?, stay_status_id?, is_refunded? }
  const keys = [];
  const vals = [];
  let idx = 1;
  for (const k of Object.keys(fields)) {
    keys.push(`${k} = $${idx++}`);
    vals.push(fields[k]);
  }
  if (!keys.length) return null;
  const q = `UPDATE bookings SET ${keys.join(
    ", "
  )} WHERE id = $${idx} RETURNING *`;
  vals.push(id);
  const res = await pool.query(q, vals);
  return res.rows[0];
};
