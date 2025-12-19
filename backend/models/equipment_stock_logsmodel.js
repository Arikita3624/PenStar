import pool from "../db.js";

// Thêm log nhập/xuất/điều chuyển thiết bị
export const createStockLog = async (data) => {
  const {
    equipment_id,
    type,
    quantity,
    from_room_id,
    to_room_id,
    note,
    created_by,
  } = data;
  const result = await pool.query(
    `INSERT INTO equipment_stock_logs (equipment_id, type, quantity, from_room_id, to_room_id, note, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [equipment_id, type, quantity, from_room_id, to_room_id, note, created_by]
  );
  return result.rows[0];
};

// Lấy lịch sử nhập/xuất kho của thiết bị
export const getStockLogsByEquipment = async (equipment_id) => {
  const result = await pool.query(
    `SELECT * FROM equipment_stock_logs WHERE equipment_id = $1 ORDER BY created_at DESC`,
    [equipment_id]
  );
  return result.rows;
};

// Lấy tất cả log
export const getAllStockLogs = async () => {
  const result = await pool.query(
    `SELECT * FROM equipment_stock_logs ORDER BY created_at DESC`
  );
  return result.rows;
};
