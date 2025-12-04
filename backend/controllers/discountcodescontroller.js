import {
  getDiscountCodes as modelGetDiscountCodes,
  getActiveDiscountCodes as modelGetActiveDiscountCodes,
  getDiscountCodeById as modelGetDiscountCodeById,
  getDiscountCodeByCode as modelGetDiscountCodeByCode,
  createDiscountCode as modelCreateDiscountCode,
  updateDiscountCode as modelUpdateDiscountCode,
  deleteDiscountCode as modelDeleteDiscountCode,
  validateDiscountCode as modelValidateDiscountCode,
  existsDiscountCode as modelExistsDiscountCode,
} from "../models/discountcodesmodel.js";

export const getDiscountCodes = async (req, res) => {
  try {
    const data = await modelGetDiscountCodes();
    res.json({
      success: true,
      message: "✅ Get discount codes successfully",
      data,
    });
  } catch (error) {
    console.error("discountcodes.getDiscountCodes error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const getDiscountCodeById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetDiscountCodeById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Discount code not found" });
    res.json({
      success: true,
      message: "✅ Get discount code successfully",
      data: item,
    });
  } catch (error) {
    console.error("discountcodes.getDiscountCodeById error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createDiscountCode = async (req, res) => {
  try {
    const payload = req.body;

    // Check if code already exists
    if (await modelExistsDiscountCode(payload.code)) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã tồn tại",
      });
    }

    const item = await modelCreateDiscountCode(payload);
    res.status(201).json({
      success: true,
      message: "✅ Tạo mã giảm giá thành công",
      data: item,
    });
  } catch (error) {
    console.error("discountcodes.createDiscountCode error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const updateDiscountCode = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Check if code already exists (excluding current id)
    if (payload.code && (await modelExistsDiscountCode(payload.code, id))) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã tồn tại",
      });
    }

    const item = await modelUpdateDiscountCode(id, payload);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Discount code not found" });

    res.json({
      success: true,
      message: "✅ Cập nhật mã giảm giá thành công",
      data: item,
    });
  } catch (error) {
    console.error("discountcodes.updateDiscountCode error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const deleteDiscountCode = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteDiscountCode(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Discount code not found" });
    res.json({
      success: true,
      message: "✅ Xóa mã giảm giá thành công",
      data: deleted,
    });
  } catch (error) {
    console.error("discountcodes.deleteDiscountCode error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// Get active discount codes (public endpoint - for customers)
export const getActiveDiscountCodes = async (req, res) => {
  try {
    const data = await modelGetActiveDiscountCodes();
    res.json({
      success: true,
      message: "✅ Get active discount codes successfully",
      data,
    });
  } catch (error) {
    console.error("discountcodes.getActiveDiscountCodes error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// Validate discount code (public endpoint)
export const validateDiscountCode = async (req, res) => {
  try {
    const { code, order_amount } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã giảm giá",
      });
    }

    const orderAmount = parseFloat(order_amount) || 0;
    const result = await modelValidateDiscountCode(code, orderAmount);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: "Mã giảm giá hợp lệ",
      data: {
        discountCode: result.discountCode,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
      },
    });
  } catch (error) {
    console.error("discountcodes.validateDiscountCode error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

