import pool from "../db.js";

/**
 * Đánh dấu no_show thủ công cho một booking (admin)
 * @param {number} bookingId
 */
export const markNoShow = async (bookingId) => {
  // 1. Lấy thông tin booking: trạng thái, giờ check-in, đã check-in chưa
  const bookingRes = await pool.query(
    `SELECT b.stay_status_id, b.checked_in_by, bi.check_in
     FROM bookings b
     LEFT JOIN booking_items bi ON bi.booking_id = b.id
     WHERE b.id = $1
     LIMIT 1`,
    [bookingId]
  );
  if (!bookingRes.rows[0]) throw new Error("Booking không tồn tại");
  const { stay_status_id, checked_in_by, check_in } = bookingRes.rows[0];

  // 2. Validate điều kiện no show
  if (stay_status_id === 4)
    throw new Error("Booking đã bị hủy, không thể no show");
  if (stay_status_id === 5) throw new Error("Booking đã bị no show");
  if (checked_in_by) throw new Error("Booking đã check-in, không thể no show");
  if (!check_in) throw new Error("Không tìm thấy thời gian check-in");
  const now = new Date();
  const checkInDate = new Date(check_in);
  // Giờ giới hạn no show là 2 tiếng sau check-in (14:00 ngày nhận phòng)
  checkInDate.setHours(14, 0, 0, 0);
  if (now < checkInDate)
    throw new Error(
      "Chỉ được no show sau 2 tiếng kể từ giờ check-in (sau 14:00 ngày nhận phòng)"
    );

  // 3. Lấy các phòng liên quan booking
  const res = await pool.query(
    `SELECT bi.room_id FROM booking_items bi WHERE bi.booking_id = $1`,
    [bookingId]
  );
  // 4. Chuyển booking sang no_show (5)
  await pool.query("UPDATE bookings SET stay_status_id = 5 WHERE id = $1", [
    bookingId,
  ]);
  // 5. Trả các phòng về available
  for (const row of res.rows) {
    await pool.query("UPDATE rooms SET status = 'available' WHERE id = $1", [
      row.room_id,
    ]);
  }
  console.log(
    `[NO_SHOW] Booking #${bookingId} đã được admin chuyển sang no_show.`
  );
};

// Có thể import và gọi hàm này từ controller khi admin thao tác trên frontend.
