import pool from "../db.js";

export const getBookings = async () => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name, u.email, u.phone 
     FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     LEFT JOIN users u ON u.id = b.user_id
     ORDER BY b.created_at DESC`
  );
  return resuit.rows;
};

export const getBookingById = async (id) => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name, u.email, u.phone 
     FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     LEFT JOIN users u ON u.id = b.user_id
     WHERE b.id = $1`,
    [id]
  );
  return resuit.rows[0];
};

export const getBookingsByUser = async (userId) => {
  const resuit = await pool.query(
    `SELECT b.*, ss.name as stay_status_name FROM bookings b
     LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
     WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
    [userId]
  );
  return resuit.rows;
};

export const createBooking = async (data) => {
  // data: { customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, items: [{room_id, check_in, check_out, room_price}], services: [{service_id, quantity, total_service_price}] }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Creating booking with data:", JSON.stringify(data, null, 2));

    const {
      customer_name,
      total_price,
      payment_status,
      booking_method,
      stay_status_id,
      user_id,
    } = data;

    // Validate required fields
    if (
      !customer_name ||
      !total_price ||
      !payment_status ||
      !booking_method ||
      !stay_status_id
    ) {
      const missing = [];
      if (!customer_name) missing.push("Tên khách hàng");
      if (!total_price) missing.push("Tổng giá");
      if (!payment_status) missing.push("Trạng thái thanh toán");
      if (!booking_method) missing.push("Phương thức đặt phòng");
      if (!stay_status_id) missing.push("Trạng thái booking");

      throw new Error(
        `Thiếu thông tin bắt buộc: ${missing.join(
          ", "
        )}. Vui lòng kiểm tra lại form.`
      );
    }

    // Check room availability
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        const { room_id, check_in, check_out } = item;

        // Check 1: Room must be available (not booked/occupied/unavailable/maintenance)
        const roomCheck = await client.query(
          `SELECT id, name, status FROM rooms WHERE id = $1`,
          [room_id]
        );

        if (roomCheck.rows.length === 0) {
          throw new Error(`Phòng ID ${room_id} không tồn tại.`);
        }

        const room = roomCheck.rows[0];
        if (room.status !== "available") {
          throw new Error(
            `Phòng "${room.name}" hiện đang ở trạng thái "${room.status}" và không thể đặt. Vui lòng chọn phòng khác.`
          );
        }

        // Check 2: Room availability in booking time range
        const availabilityCheck = await client.query(
          `SELECT bi.id, b.id as booking_id, b.customer_name, bi.check_in, bi.check_out
           FROM booking_items bi
           JOIN bookings b ON bi.booking_id = b.id
           WHERE bi.room_id = $1
             AND b.stay_status_id IN (1, 2, 6)
             AND NOT (bi.check_out <= $2 OR bi.check_in >= $3)`,
          [room_id, check_in, check_out]
        );

        if (availabilityCheck.rows.length > 0) {
          const conflict = availabilityCheck.rows[0];
          throw new Error(
            `Phòng đã được đặt! Phòng này đã có booking từ ${conflict.check_in} đến ${conflict.check_out}. Vui lòng chọn phòng khác hoặc thời gian khác.`
          );
        }
      }
    }

    const insertBookingText = `INSERT INTO bookings (customer_name, total_price, payment_status, payment_method, booking_method, stay_status_id, user_id, created_at, is_refunded)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), FALSE) RETURNING *`;
    const bookingRes = await client.query(insertBookingText, [
      customer_name,
      total_price,
      payment_status,
      data.payment_method || null, // Phương thức thanh toán (optional)
      booking_method,
      stay_status_id,
      user_id,
    ]);
    const booking = bookingRes.rows[0];

    // fetch joined stay_status name
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [booking.id]
    );
    const bookingWithStatus = joined.rows[0];

    // insert booking_items if provided
    if (Array.isArray(data.items)) {
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, check_in, check_out, room_price, num_adults, num_children) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      for (const item of data.items) {
        const {
          room_id,
          check_in,
          check_out,
          room_price,
          num_adults,
          num_children,
          guests,
        } = item;
        const itemResult = await client.query(insertItemText, [
          booking.id,
          room_id,
          check_in,
          check_out,
          room_price,
          num_adults || 1,
          num_children || 0,
        ]);

        const booking_item_id = itemResult.rows[0].id;

        // Insert guests for this booking_item
        if (Array.isArray(guests) && guests.length > 0) {
          const insertGuestText = `INSERT INTO booking_guests (booking_item_id, guest_name, guest_type, age, is_primary) VALUES ($1, $2, $3, $4, $5)`;
          for (const guest of guests) {
            await client.query(insertGuestText, [
              booking_item_id,
              guest.guest_name,
              guest.guest_type,
              guest.age || null,
              guest.is_primary || false,
            ]);
          }
        }

        // Update room status to 'pending' when booking is created (client creates → stay_status_id=6 pending)
        await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
          "pending",
          room_id,
        ]);
      }
    }

    // insert booking_items with multi-room support if rooms array provided
    if (Array.isArray(data.rooms)) {
      const insertItemText = `INSERT INTO booking_items (booking_id, room_id, check_in, check_out, room_price, num_adults, num_children, special_requests) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;

      for (const room of data.rooms) {
        const { room_id, num_adults, num_children, special_requests } = room;
        const check_in = data.check_in;
        const check_out = data.check_out;

        // Get room price
        const roomResult = await client.query(
          "SELECT price FROM rooms WHERE id = $1",
          [room_id]
        );
        const room_price = roomResult.rows[0]?.price || 0;

        const itemResult = await client.query(insertItemText, [
          booking.id,
          room_id,
          check_in,
          check_out,
          room_price,
          num_adults || 1,
          num_children || 0,
          special_requests || null,
        ]);

        const booking_item_id = itemResult.rows[0].id;

        // Insert guests for this room
        if (Array.isArray(room.guests)) {
          const insertGuestText = `INSERT INTO booking_guests (booking_item_id, guest_name, guest_type, age, is_primary) VALUES ($1, $2, $3, $4, $5)`;
          for (const guest of room.guests) {
            await client.query(insertGuestText, [
              booking_item_id,
              guest.guest_name,
              guest.guest_type,
              guest.age || null,
              guest.is_primary || false,
            ]);
          }
        }

        // Insert services for this room
        if (Array.isArray(room.service_ids) && room.service_ids.length > 0) {
          const insertServiceText = `INSERT INTO booking_services (booking_id, service_id, quantity, total_service_price) VALUES ($1, $2, $3, $4)`;
          for (const service_id of room.service_ids) {
            // Get service price
            const serviceResult = await client.query(
              "SELECT price FROM services WHERE id = $1",
              [service_id]
            );
            const service_price = serviceResult.rows[0]?.price || 0;

            await client.query(insertServiceText, [
              booking.id,
              service_id,
              1, // quantity default to 1
              service_price,
            ]);
          }
        }

        // Update room status to 'pending'
        await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
          "pending",
          room_id,
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
    return bookingWithStatus;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateBookingStatus = async (id, fields) => {
  // fields: { payment_status?, stay_status_id?, is_refunded? }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if booking is cancelled before allowing payment_status update
    if (fields.payment_status && fields.payment_status !== "refunded") {
      const checkResult = await client.query(
        "SELECT stay_status_id FROM bookings WHERE id = $1",
        [id]
      );
      if (checkResult.rows[0]?.stay_status_id === 4) {
        throw new Error(
          "Không thể cập nhật trạng thái thanh toán khi booking đã hủy. Chỉ có thể chọn 'Refunded' để hoàn tiền."
        );
      }
    }

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
    const res = await client.query(q, vals);
    const updated = res.rows[0];

    // Auto update room status based on booking status
    if (fields.stay_status_id) {
      const items = await client.query(
        "SELECT room_id FROM booking_items WHERE booking_id = $1",
        [id]
      );

      let roomStatus = null;
      const statusId = Number(fields.stay_status_id);

      // Database mapping: 1=reserved, 2=checked_in, 3=checked_out, 4=canceled, 5=no_show, 6=pending
      if (statusId === 6) roomStatus = "pending"; // pending -> chờ duyệt
      else if (statusId === 1) roomStatus = "booked"; // reserved -> đã đặt
      else if (statusId === 2) roomStatus = "occupied"; // checked_in -> đang ở
      else if (statusId === 3)
        roomStatus = "checkout"; // checked_out -> chờ admin xác nhận
      else if (statusId === 4 || statusId === 5) roomStatus = "available"; // canceled/no_show -> trống

      if (roomStatus) {
        for (const item of items.rows) {
          await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
            roomStatus,
            item.room_id,
          ]);
        }
      }
    }

    await client.query("COMMIT");

    // return joined row with stay_status_name
    const joined = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );
    return joined.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const confirmCheckout = async (id) => {
  // Admin confirms checkout -> room status changes to "cleaning", booking stays at checked_out (3)
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if booking is at checked_out status
    const checkBooking = await client.query(
      "SELECT stay_status_id FROM bookings WHERE id = $1",
      [id]
    );
    if (!checkBooking.rows[0] || checkBooking.rows[0].stay_status_id !== 3) {
      throw new Error("Booking không ở trạng thái checked_out");
    }

    // Get rooms from this booking
    const items = await client.query(
      "SELECT room_id FROM booking_items WHERE booking_id = $1",
      [id]
    );

    // Update all rooms to "cleaning" status
    for (const item of items.rows) {
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        "cleaning",
        item.room_id,
      ]);
    }

    await client.query("COMMIT");

    // Return updated booking
    const booking = await client.query(
      `SELECT b.*, ss.name as stay_status_name FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );
    return booking.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const cancelBooking = async (id, userId, isAdmin = false) => {
  // Cancel booking with business logic: check permissions, calculate refund
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get booking details
    const bookingRes = await client.query(
      `SELECT b.*, bi.check_in 
       FROM bookings b
       LEFT JOIN booking_items bi ON bi.booking_id = b.id
       WHERE b.id = $1
       LIMIT 1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      throw new Error("Booking không tồn tại");
    }

    const booking = bookingRes.rows[0];
    const currentStatus = booking.stay_status_id;
    const paymentStatus = booking.payment_status;
    const checkInDate = new Date(booking.check_in);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    // Permission check based on role and status
    if (!isAdmin) {
      // User cancellation rules
      if (currentStatus === 1) {
        // reserved (1) - can cancel but check time
        if (hoursUntilCheckIn < 24) {
          throw new Error(
            "Không thể hủy booking trong vòng 24h trước check-in. Vui lòng liên hệ admin."
          );
        }
      } else if (currentStatus === 0) {
        // pending (0) - can cancel freely
        // Allow cancellation
      } else if (currentStatus === 2) {
        // checked_in (2) - cannot cancel, only checkout
        throw new Error(
          "Không thể hủy khi đã check-in. Vui lòng liên hệ admin."
        );
      } else if ([3, 4].includes(currentStatus)) {
        // checked_out/cancelled - already finished
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      } else {
        throw new Error("Không thể hủy booking ở trạng thái này");
      }

      // User can only cancel their own bookings
      if (booking.user_id !== userId) {
        throw new Error("Bạn không có quyền hủy booking này");
      }
    } else {
      // Admin/Staff/Manager cancellation rules - more permissive
      if (currentStatus === 0) {
        // pending (0) - staff can cancel
        // Allow
      } else if (currentStatus === 1) {
        // reserved (1) - staff can cancel
        // Allow
      } else if (currentStatus === 2) {
        // checked_in (2) - staff CAN cancel (force cancel)
        // Allow (staff has more power)
      } else if ([3, 4].includes(currentStatus)) {
        // checked_out/cancelled
        throw new Error("Booking đã hoàn tất hoặc đã bị hủy trước đó");
      }
    }

    // NEW LOGIC: When cancel, set payment_status to "failed"
    // Admin can later change to "refunded" if needed
    await client.query(
      `UPDATE bookings 
       SET stay_status_id = 4,
           payment_status = 'failed'
       WHERE id = $1`,
      [id]
    );

    // Update room status to available
    const items = await client.query(
      "SELECT room_id FROM booking_items WHERE booking_id = $1",
      [id]
    );

    for (const item of items.rows) {
      await client.query("UPDATE rooms SET status = $1 WHERE id = $2", [
        "available",
        item.room_id,
      ]);
    }

    await client.query("COMMIT");

    // Return updated booking
    const result = await client.query(
      `SELECT b.*, ss.name as stay_status_name 
       FROM bookings b
       LEFT JOIN stay_status ss ON ss.id = b.stay_status_id
       WHERE b.id = $1`,
      [id]
    );

    return {
      booking: result.rows[0],
      message:
        "Booking đã được hủy (payment_status = Failed). Admin có thể cập nhật thành Refunded nếu cần hoàn tiền.",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
