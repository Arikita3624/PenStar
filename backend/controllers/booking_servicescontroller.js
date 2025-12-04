import {
  getBookingServices as modelGetBookingServices,
  getBookingServiceById as modelGetBookingServiceById,
  createBookingService as modelCreateBookingService,
  deleteBookingService as modelDeleteBookingService,
  getServicesByBookingItem as modelGetServicesByBookingItem,
  getServicesByBooking as modelGetServicesByBooking,
} from "../models/booking_servicesmodel.js";
import pool from "../db.js";

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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { booking_id, booking_item_id, service_id, quantity = 1 } = req.body;

    // Validate required fields
    if (!booking_id || !service_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu booking_id hoặc service_id",
      });
    }

    // Get service price
    const serviceRes = await client.query(
      "SELECT price FROM services WHERE id = $1",
      [service_id]
    );
    if (serviceRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dịch vụ không tồn tại",
      });
    }
    const servicePrice = serviceRes.rows[0].price;
    const total_service_price = servicePrice * quantity;

    // Create booking service
    const item = await modelCreateBookingService({
      booking_id,
      booking_item_id: booking_item_id || null,
      service_id,
      quantity,
      total_service_price,
    });

    // Update booking total_price
    await client.query(
      "UPDATE bookings SET total_price = total_price + $1 WHERE id = $2",
      [total_service_price, booking_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "✅ Thêm dịch vụ thành công",
      data: item,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("booking_services.createBookingService error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

export const deleteBookingService = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get service info before deleting
    const serviceRes = await client.query(
      "SELECT booking_id, total_service_price FROM booking_services WHERE id = $1",
      [id]
    );

    if (serviceRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking service not found",
      });
    }

    const { booking_id, total_service_price } = serviceRes.rows[0];

    // Delete service
    const deleted = await modelDeleteBookingService(id);
    if (!deleted) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Booking service not found",
      });
    }

    // Update booking total_price
    await client.query(
      "UPDATE bookings SET total_price = total_price - $1 WHERE id = $2",
      [total_service_price, booking_id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "✅ Xóa dịch vụ thành công",
      data: deleted,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("booking_services.deleteBookingService error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Get services by booking_item_id
export const getServicesByBookingItem = async (req, res) => {
  try {
    const { booking_item_id } = req.params;
    const data = await modelGetServicesByBookingItem(booking_item_id);
    res.json({
      success: true,
      message: "✅ Get services by booking item successfully",
      data,
    });
  } catch (error) {
    console.error("booking_services.getServicesByBookingItem error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// Get services by booking_id
export const getServicesByBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const data = await modelGetServicesByBooking(booking_id);
    res.json({
      success: true,
      message: "✅ Get services by booking successfully",
      data,
    });
  } catch (error) {
    console.error("booking_services.getServicesByBooking error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
