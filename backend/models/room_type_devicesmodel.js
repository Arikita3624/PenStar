import pool from "../db.js";

// Lấy tất cả thiết bị theo room_type_id
export const getDevicesByRoomType = async (room_type_id) => {
  const result = await pool.query(
    `SELECT d.* , rtd.is_default, rtd.note
     FROM room_type_devices rtd
     JOIN devices d ON rtd.device_id = d.id
     WHERE rtd.room_type_id = $1`,
    [room_type_id]
  );
  return result.rows;
};

// Thêm thiết bị vào room_type
export const addDeviceToRoomType = async (
  room_type_id,
  device_id,
  is_default = false,
  note = null
) => {
  const result = await pool.query(
    `INSERT INTO room_type_devices (room_type_id, device_id, is_default, note)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [room_type_id, device_id, is_default, note]
  );
  return result.rows[0];
};

// Xóa thiết bị khỏi room_type
export const removeDeviceFromRoomType = async (room_type_id, device_id) => {
  const result = await pool.query(
    `DELETE FROM room_type_devices WHERE room_type_id = $1 AND device_id = $2 RETURNING *`,
    [room_type_id, device_id]
  );
  return result.rows[0];
};

// Cập nhật thông tin thiết bị trong room_type
export const updateDeviceInRoomType = async (
  room_type_id,
  device_id,
  is_default,
  note
) => {
  const result = await pool.query(
    `UPDATE room_type_devices SET is_default = $3, note = $4 WHERE room_type_id = $1 AND device_id = $2 RETURNING *`,
    [room_type_id, device_id, is_default, note]
  );
  return result.rows[0];
};
