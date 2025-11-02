import {
  getBookings as modelGetBookings,
  getBookingById as modelGetBookingById,
  createBooking as modelCreateBooking,
  updateBookingStatus as modelUpdateBookingStatus,
  getBookingsByUser as modelGetBookingsByUser,
  confirmCheckout as modelConfirmCheckout,
  cancelBooking as modelCancelBooking,
} from "../models/bookingsmodel.js";
import pool from "../db.js";

export const getBookings = async (req, res) => {
  try {
    const data = await modelGetBookings();
    res.json({
      success: true,
      message: "✅ Get all bookings successfully",
      data,
    });
  } catch (error) {
    console.error("bookingscontroller.getBookings error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // fetch items and services
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [id]
    );
    const servicesRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1",
      [id]
    );

    booking.items = itemsRes.rows;
    booking.services = servicesRes.rows;

    // Fetch guests for each booking_item
    for (const item of booking.items) {
      const guestsRes = await pool.query(
        "SELECT * FROM booking_guests WHERE booking_item_id = $1 ORDER BY is_primary DESC, id ASC",
        [item.id]
      );
      item.guests = guestsRes.rows;
    }

    // Add check_in and check_out from first booking_item for convenience
    if (booking.items && booking.items.length > 0) {
      booking.check_in = booking.items[0].check_in;
      booking.check_out = booking.items[0].check_out;
    }

    // Calculate total prices
    booking.total_room_price = booking.items.reduce(
      (sum, item) => sum + Number(item.room_price || 0),
      0
    );
    booking.total_service_price = booking.services.reduce(
      (sum, service) => sum + Number(service.total_service_price || 0),
      0
    );
    booking.total_amount =
      booking.total_room_price + booking.total_service_price;
    // Ghi đè total_price bằng giá trị tính toán đúng (không lấy từ DB)
    booking.total_price = booking.total_amount;

    res.json({
      success: true,
      message: "✅ Get booking by ID successfully",
      data: booking,
    });
  } catch (error) {
    console.error("bookingscontroller.getBookingById error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    console.log("=== CREATE BOOKING REQUEST ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request user:", req.user);

    const payload = req.body;
    // If authenticated, prefer user id from token
    if (req.user && req.user.id) {
      payload.user_id = Number(req.user.id);
    }

    console.log("Final payload:", JSON.stringify(payload, null, 2));

    const booking = await modelCreateBooking(payload);

    // fetch created items and services
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [booking.id]
    );
    const servicesRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1",
      [booking.id]
    );
    booking.items = itemsRes.rows;
    booking.services = servicesRes.rows;
    res.status(201).json({
      success: true,
      message: "✅ Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("=== CREATE BOOKING ERROR ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Foreign key constraint - record liên quan không tồn tại
    if (error && error.code === "23503") {
      const fieldMap = {
        user_id: "Người dùng không tồn tại",
        stay_status_id: "Trạng thái booking không hợp lệ",
        room_id: "Phòng không tồn tại",
        service_id: "Dịch vụ không tồn tại",
      };

      let detail = error.detail || "";
      let friendlyMsg = "Dữ liệu liên quan không tồn tại";

      for (const [field, msg] of Object.entries(fieldMap)) {
        if (detail.includes(field)) {
          friendlyMsg = msg;
          break;
        }
      }

      return res.status(400).json({
        success: false,
        message: friendlyMsg,
        error: error.message,
      });
    }

    // Not null constraint - thiếu trường bắt buộc
    if (error && error.code === "23502") {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc. Vui lòng điền đầy đủ form.",
        error: error.message,
      });
    }

    // Check constraint - dữ liệu không hợp lệ
    if (error && error.code === "23514") {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
        error: error.message,
      });
    }

    // Custom error từ business logic
    if (error.message && error.message.includes("Phòng đã được đặt")) {
      return res.status(409).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    if (error.message && error.message.includes("Thiếu thông tin")) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message,
      });
    }

    // Lỗi chung
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi hệ thống. Vui lòng thử lại sau.",
      error: error.message,
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false });
    const data = await modelGetBookingsByUser(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updated = await modelUpdateBookingStatus(id, fields);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};

// Client can update their own booking status (check-in, check-out)
export const updateMyBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { stay_status_id, payment_method, payment_status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    // Verify booking belongs to user
    const booking = await modelGetBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking không tồn tại",
      });
    }

    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật booking này",
      });
    }

    // Nếu client gửi payment_status thì update payment_status
    if (payment_status) {
      const updated = await modelUpdateBookingStatus(id, { payment_status });
      return res.json({
        success: true,
        message: "Cập nhật trạng thái thanh toán thành công!",
        data: updated,
      });
    }

    // Nếu client gửi payment_method thì chỉ update payment_method
    if (payment_method) {
      const updated = await modelUpdateBookingStatus(id, { payment_method });
      return res.json({
        success: true,
        message: "Cập nhật phương thức thanh toán thành công!",
        data: updated,
      });
    }

    // Nếu gửi stay_status_id thì xử lý như cũ
    if (stay_status_id !== undefined) {
      // Only allow check-in (2) and check-out (3)
      if (![2, 3].includes(stay_status_id)) {
        return res.status(400).json({
          success: false,
          message: "Bạn chỉ có thể check-in hoặc check-out",
        });
      }

      // Check-in requires: status = 1 (reserved) AND payment = paid
      if (stay_status_id === 2) {
        if (booking.stay_status_id !== 1) {
          return res.status(400).json({
            success: false,
            message: "Chỉ có thể check-in khi booking đã được duyệt",
          });
        }
        if (booking.payment_status !== "paid") {
          return res.status(400).json({
            success: false,
            message: "Vui lòng thanh toán trước khi check-in",
          });
        }
      }

      // Check-out requires: status = 2 (checked_in)
      if (stay_status_id === 3) {
        if (booking.stay_status_id !== 2) {
          return res.status(400).json({
            success: false,
            message: "Chỉ có thể check-out khi đã check-in",
          });
        }
      }

      const updated = await modelUpdateBookingStatus(id, { stay_status_id });
      return res.json({
        success: true,
        message:
          stay_status_id === 2
            ? "Check-in thành công!"
            : "Check-out thành công!",
        data: updated,
      });
    }
  } catch (err) {
    console.error("updateMyBookingStatus error:", err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};

export const confirmCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await modelConfirmCheckout(id);
    res.json({
      success: true,
      message: "Đã xác nhận checkout - Phòng chuyển sang trạng thái Cleaning",
      data: updated,
    });
  } catch (err) {
    console.error("confirmCheckout error:", err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.role_id === 1; // Assuming role_id 1 is admin

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    const result = await modelCancelBooking(id, userId, isAdmin);

    res.json({
      success: true,
      message: result.message || "Đã hủy booking thành công.",
      data: result.booking,
    });
  } catch (err) {
    console.error("cancelBooking error:", err);
    res.status(400).json({
      success: false,
      message: err.message || "Không thể hủy booking",
      error: err.message,
    });
  }
};
