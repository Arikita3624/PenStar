import {
  getBookingServices as modelGetBookingServices,
  getBookingServiceById as modelGetBookingServiceById,
  createBookingService as modelCreateBookingService,
  deleteBookingService as modelDeleteBookingService,
} from "../models/booking_servicesmodel.js";
import { getBookingById as modelGetBookingById } from "../models/bookingsmodel.js";

export const getBookingServices = async (req, res) => {
  try {
    const data = await modelGetBookingServices();
    res.json({
      success: true,
      message: "✅ Get booking services successfully",
      data,
    });
  } catch (error) {
    console.error("booking_services.getBookingServices error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};

export const getBookingServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetBookingServiceById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Booking service not found" });
    res.json({
      success: true,
      message: "✅ Get booking service successfully",
      data: item,
    });
  } catch (error) {
    console.error("booking_services.getBookingServiceById error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};

export const createBookingService = async (req, res) => {
  try {
    const payload = req.body;
    const item = await modelCreateBookingService(payload);
    res
      .status(201)
      .json({
        success: true,
        message: "✅ Booking service created",
        data: item,
      });
  } catch (error) {
    console.error("booking_services.createBookingService error:", error);
    if (error && error.code === "23503") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Foreign key constraint failed",
          error: error.message,
        });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};

// Customer requests a service for their booking (during their stay)
export const createBookingServiceRequest = async (req, res) => {
  try {
    const payload = req.body; // { booking_id, service_id, quantity, total_service_price }
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    // Verify booking exists and belongs to this user (unless staff/admin)
    const booking = await modelGetBookingById(payload.booking_id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    const userRole = (user.role || user.role_name || "").toString().toLowerCase();
    const isStaff = ["staff", "manager", "admin"].includes(userRole);
    if (!isStaff && booking.user_id !== user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền yêu cầu dịch vụ cho booking này" });
    }

    // Only allow service requests when booking is checked-in (2)
    if (booking.stay_status_id !== 2) {
      return res.status(400).json({ success: false, message: "Chỉ có thể yêu cầu dịch vụ khi đã check-in" });
    }

    const item = await modelCreateBookingService(payload);
    res.status(201).json({ success: true, message: "✅ Yêu cầu dịch vụ đã được gửi", data: item });
  } catch (error) {
    console.error("booking_services.createBookingServiceRequest error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({ success: false, message: "Foreign key constraint failed", error: error.message });
    }
    res.status(500).json({ success: false, message: "🚨 Internal server error", error: error.message });
  }
};

export const deleteBookingService = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteBookingService(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Booking service not found" });
    res.json({
      success: true,
      message: "✅ Booking service deleted",
      data: deleted,
    });
  } catch (error) {
    console.error("booking_services.deleteBookingService error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};
