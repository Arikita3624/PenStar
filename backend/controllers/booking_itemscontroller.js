import {
  getBookingItems as modelGetBookingItems,
  getBookingItemById as modelGetBookingItemById,
  createBookingItem as modelCreateBookingItem,
  deleteBookingItem as modelDeleteBookingItem,
} from "../models/booking_itemsmodel.js";

export const getBookingItems = async (req, res) => {
  try {
    const data = await modelGetBookingItems();
    res.json({
      success: true,
      message: "✅ Get booking items successfully",
      data,
    });
  } catch (error) {
    console.error("booking_items.getBookingItems error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const getBookingItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetBookingItemById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Booking item not found" });
    res.json({
      success: true,
      message: "✅ Get booking item successfully",
      data: item,
    });
  } catch (error) {
    console.error("booking_items.getBookingItemById error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createBookingItem = async (req, res) => {
  try {
    const payload = req.body;
    const item = await modelCreateBookingItem(payload);
    res
      .status(201)
      .json({ success: true, message: "✅ Booking item created", data: item });
  } catch (error) {
    console.error("booking_items.createBookingItem error:", error);
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
  }
};

export const deleteBookingItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteBookingItem(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Booking item not found" });
    res.json({
      success: true,
      message: "✅ Booking item deleted",
      data: deleted,
    });
  } catch (error) {
    console.error("booking_items.deleteBookingItem error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
