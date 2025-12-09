import pool from "../db.js";

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_device_damages (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      booking_item_id INTEGER REFERENCES booking_items(id) ON DELETE SET NULL,
      device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
      device_name TEXT NOT NULL,
      description TEXT,
      amount NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS damage_total NUMERIC DEFAULT 0;
  `);
};

export const getDamagesByBookingId = async (bookingId) => {
  await ensureTable();
  const res = await pool.query(
    `SELECT * FROM booking_device_damages WHERE booking_id = $1 ORDER BY id`,
    [bookingId]
  );
  console.log(`[BookingDamages] Loaded ${res.rows.length} damages for booking ${bookingId}`);
  return res.rows;
};

export const replaceDamagesForBooking = async (bookingId, damages = []) => {
  await ensureTable();
  console.log(`[BookingDamages] Replacing damages for booking ${bookingId}, count: ${damages.length}`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingSumRes = await client.query(
      "SELECT COALESCE(SUM(amount),0) AS total FROM booking_device_damages WHERE booking_id = $1",
      [bookingId]
    );
    const existingSum = Number(existingSumRes.rows[0]?.total || 0);

    // Tính tổng mới
    const newSum = damages.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

    // Xóa damage cũ
    await client.query(
      "DELETE FROM booking_device_damages WHERE booking_id = $1",
      [bookingId]
    );

    // Chèn damage mới
    for (const d of damages) {
      console.log(`[BookingDamages] Inserting damage:`, {
        booking_id: bookingId,
        device_name: d.device_name,
        amount: d.amount,
      });
      await client.query(
        `INSERT INTO booking_device_damages
         (booking_id, booking_item_id, device_id, device_name, description, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          bookingId,
          d.booking_item_id || null,
          d.device_id || null,
          d.device_name,
          d.description || null,
          Number(d.amount) || 0,
        ]
      );
    }

    // Lấy base total không tính damage cũ
    const bookingRes = await client.query(
      "SELECT total_price, damage_total FROM bookings WHERE id = $1",
      [bookingId]
    );
    const booking = bookingRes.rows[0] || {};
    const currentTotal = Number(booking.total_price) || 0;
    const baseTotal = Math.max(0, currentTotal - existingSum);
    const newTotal = baseTotal + newSum;

    // Update tổng damage và total_price
    await client.query(
      "UPDATE bookings SET damage_total = $1, total_price = $2 WHERE id = $3",
      [newSum, newTotal, bookingId]
    );

    await client.query("COMMIT");
    console.log(`[BookingDamages] Successfully saved damages for booking ${bookingId}: damage_total=${newSum}, total_price=${newTotal}`);
    return { damage_total: newSum, total_price: newTotal };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[BookingDamages] Error saving damages for booking ${bookingId}:`, err);
    throw err;
  } finally {
    client.release();
  }
};

