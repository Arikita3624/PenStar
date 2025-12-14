import {
  getBookings as modelGetBookings,
  getBookingById as modelGetBookingById,
  createBooking as modelCreateBooking,
  updateBookingStatus as modelUpdateBookingStatus,
  getBookingsByUser as modelGetBookingsByUser,
  confirmCheckout as modelConfirmCheckout,
  cancelBooking as modelCancelBooking,
  changeRoomInBooking as modelChangeRoomInBooking,
  autoAssignRooms as modelAutoAssignRooms,
  confirmCheckin as modelConfirmCheckin,
} from "../models/bookingsmodel.js";
// import { incrementUsageCount as modelIncrementUsageCount } from "../models/discountcodesmodel.js"; // [CLEANUP] Đã comment dòng liên quan đến discount
import pool from "../db.js";
import { markNoShow } from "../utils/markNoShow.js";

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

    // fetch items and services only
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

    // Add check_in and check_out from first booking_item for convenience
    if (booking.items && booking.items.length > 0) {
      booking.check_in = booking.items[0].check_in;
      booking.check_out = booking.items[0].check_out;
    }

    // Nếu DB chưa có total_room_price/total_service_price (old data), tính lại
    if (!booking.total_room_price) {
      booking.total_room_price = booking.items.reduce((sum, item) => {
        return sum + Number(item.room_type_price || 0);
      }, 0);
    }

    if (!booking.total_service_price) {
      booking.total_service_price = booking.services.reduce(
        (sum, service) => sum + Number(service.total_service_price || 0),
        0
      );
    }

    // Nếu booking đã bị hủy và có canceled_by, lấy tên người hủy
    if (booking.canceled_by) {
      const userRes = await pool.query(
        "SELECT full_name, email FROM users WHERE id = $1",
        [booking.canceled_by]
      );
      if (userRes.rows[0]) {
        booking.canceled_by_name = userRes.rows[0].email || null;
        if (!booking.canceled_by_name && userRes.rows[0].full_name) {
          booking.canceled_by_name = userRes.rows[0].full_name;
        }
      }
    }
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

    // Không build lại items từ rooms_config nữa. Nếu frontend gửi items thì insert trực tiếp, nếu gửi rooms_config thì báo lỗi.
    if (Array.isArray(payload.rooms_config)) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng gửi trực tiếp mảng items từ frontend. Không hỗ trợ build lại items từ rooms_config ở backend nữa.",
      });
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

    // Đã bỏ gửi email ở đây, chỉ gửi sau khi thanh toán thành công

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

    if (error.message && error.message.includes("Không đủ phòng trống")) {
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

    // ⚠️ Nếu cập nhật stay_status_id = 4 (cancelled), cần giải phóng phòng
    if (fields.stay_status_id === 4) {
      // Lấy danh sách phòng từ booking_items
      const itemsRes = await pool.query(
        "SELECT room_id FROM booking_items WHERE booking_id = $1",
        [id]
      );

      // Giải phóng tất cả phòng về "available"
      for (const item of itemsRes.rows) {
        if (item.room_id) {
          await pool.query(
            "UPDATE rooms SET status = 'available' WHERE id = $1",
            [item.room_id]
          );
        }
      }

      console.log(
        `✅ Đã giải phóng ${itemsRes.rows.length} phòng của booking #${id}`
      );
    }

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
      // [CLEANUP] Đã bỏ block tăng usage count cho mã giảm giá
      // Gửi email xác nhận nếu đã thanh toán thành công
      try {
        const booking = await modelGetBookingById(id);
        const customerEmail = booking.email;
        if (customerEmail) {
          const { sendBookingConfirmationEmail } = await import(
            "../utils/mailer.js"
          );
          await sendBookingConfirmationEmail(customerEmail, id);
          console.log(
            `Đã gửi email xác nhận booking #${id} tới ${customerEmail}`
          );
        } else {
          console.warn("Không tìm thấy email khách để gửi xác nhận booking");
        }
      } catch (mailErr) {
        console.error("Lỗi gửi email xác nhận booking:", mailErr);
      }
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

    // Không cho phép user cập nhật stay_status_id (check-in/check-out)
    if (stay_status_id !== undefined) {
      return res.status(403).json({
        success: false,
        message:
          "Chỉ admin hoặc nhân viên mới được phép check-in/check-out. Vui lòng liên hệ lễ tân hoặc quản trị viên!",
      });
    }
  } catch (err) {
    console.error("updateMyBookingStatus error:", err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};

export const confirmCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await modelConfirmCheckin(id, userId);
    res.json({
      success: true,
      message: "Đã check-in thành công",
      data: result,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const confirmCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const updated = await modelConfirmCheckout(id, userId);
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
    const userRoleId = req.user?.role_id;
    const { cancel_reason } = req.body;
    // Admin (4), Manager (3), Staff (2) đều có quyền hủy bất kỳ booking nào
    const isStaffOrAbove = userRoleId && userRoleId >= 2;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login.",
      });
    }

    const result = await modelCancelBooking(
      id,
      userId,
      isStaffOrAbove,
      cancel_reason
    );

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

export const adminMarkNoShow = async (req, res) => {
  const { id } = req.params; // id booking
  try {
    await markNoShow(Number(id));
    res.json({ success: true, message: "Booking đã chuyển sang no_show." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
