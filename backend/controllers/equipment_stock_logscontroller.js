import {
  createStockLog,
  getStockLogsByEquipment,
  getAllStockLogs,
} from "../models/equipment_stock_logsmodel.js";
import pool from "../db.js";

// Nhập kho thiết bị
export const importEquipment = async (req, res) => {
  try {
    const { equipment_id, quantity, note, created_by } = req.body;
    if (!equipment_id || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu thông tin hoặc số lượng không hợp lệ",
        });
    }
    // Tăng tồn kho
    await pool.query(
      `UPDATE master_equipments SET total_stock = total_stock + $1 WHERE id = $2`,
      [quantity, equipment_id]
    );
    // Ghi log
    await createStockLog({
      equipment_id,
      type: "import",
      quantity,
      from_room_id: null,
      to_room_id: null,
      note,
      created_by,
    });
    res.json({ success: true, message: "Nhập kho thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi nhập kho", error: error.message });
  }
};

// Xuất kho thiết bị
export const exportEquipment = async (req, res) => {
  try {
    const { equipment_id, quantity, note, created_by } = req.body;
    if (!equipment_id || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu thông tin hoặc số lượng không hợp lệ",
        });
    }
    // Kiểm tra tồn kho
    const check = await pool.query(
      `SELECT total_stock FROM master_equipments WHERE id = $1`,
      [equipment_id]
    );
    if (!check.rows[0] || check.rows[0].total_stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Không đủ tồn kho để xuất" });
    }
    // Giảm tồn kho
    await pool.query(
      `UPDATE master_equipments SET total_stock = total_stock - $1 WHERE id = $2`,
      [quantity, equipment_id]
    );
    // Ghi log
    await createStockLog({
      equipment_id,
      type: "export",
      quantity,
      from_room_id: null,
      to_room_id: null,
      note,
      created_by,
    });
    res.json({ success: true, message: "Xuất kho thành công" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi xuất kho", error: error.message });
  }
};

// Điều chuyển thiết bị giữa các phòng
export const transferEquipment = async (req, res) => {
  try {
    const {
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    } = req.body;
    if (
      !equipment_id ||
      !quantity ||
      quantity <= 0 ||
      !from_room_id ||
      !to_room_id
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu thông tin hoặc số lượng/phòng không hợp lệ",
        });
    }
    // Ghi log điều chuyển (không thay đổi tổng tồn kho)
    await createStockLog({
      equipment_id,
      type: "transfer",
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    });
    res.json({ success: true, message: "Điều chuyển thành công" });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi điều chuyển",
        error: error.message,
      });
  }
};

// Lấy lịch sử nhập/xuất/điều chuyển của thiết bị
export const getEquipmentLogs = async (req, res) => {
  try {
    const { equipment_id } = req.query;
    if (!equipment_id)
      return res
        .status(400)
        .json({ success: false, message: "Thiếu equipment_id" });
    const logs = await getStockLogsByEquipment(equipment_id);
    res.json({ success: true, data: logs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy log", error: error.message });
  }
};

// Lấy toàn bộ log
export const getAllLogs = async (req, res) => {
  try {
    const logs = await getAllStockLogs();
    res.json({ success: true, data: logs });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi lấy log", error: error.message });
  }
};
