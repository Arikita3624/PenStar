import pool from "../db.js";

// Lấy tất cả thiết bị theo room_id (không còn room_type_id)
export const getDevices = async ({ room_id = null } = {}) => {
  let query = "SELECT * FROM room_devices WHERE 1=1";
  const params = [];
  if (room_id) {
    query += " AND room_id = $1";
    params.push(room_id);
  }
  const result = await pool.query(query, params);
  return result.rows;
};

export const createDevice = async (data) => {
  const {
    master_equipment_id,
    device_name,
    device_type,
    status = "working",
    room_id = null,
    note = null,
    images = null,
    quantity = 1,
  } = data;
  const result = await pool.query(
    `INSERT INTO room_devices (master_equipment_id, device_name, device_type, status, room_id, note, images, quantity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      master_equipment_id,
      device_name,
      device_type,
      status,
      room_id,
      note,
      images,
      quantity,
    ]
  );
  return result.rows[0];
};

export const updateDevice = async (id, data) => {
  // Nếu chỉ truyền quantity (sửa tồn kho), chỉ update quantity
  if (Object.keys(data).length === 1 && data.quantity !== undefined) {
    const result = await pool.query(
      `UPDATE room_devices SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [data.quantity, id]
    );
    return result.rows[0];
  }
  // Nếu truyền nhiều trường, update đầy đủ
  const { device_name, device_type, status, room_id, note, images, quantity } =
    data;
  const result = await pool.query(
    `UPDATE room_devices SET
      device_name = COALESCE($1, device_name),
      device_type = COALESCE($2, device_type),
      status = COALESCE($3, status),
      room_id = COALESCE($4, room_id),
      note = COALESCE($5, note),
      images = COALESCE($6, images),
      quantity = COALESCE($7, quantity),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [device_name, device_type, status, room_id, note, images, quantity, id]
  );
  return result.rows[0];
};

export const deleteDevice = async (id) => {
  const result = await pool.query(
    "DELETE FROM room_devices WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};

// Điều chuyển thiết bị giữa 2 phòng
export const transferDevice = async ({
  equipment_id,
  quantity,
  from_room_id,
  to_room_id,
}) => {
  if (!equipment_id || !quantity || !from_room_id || !to_room_id)
    throw new Error("Thiếu thông tin điều chuyển");
  if (from_room_id === to_room_id)
    throw new Error("Không thể chuyển thiết bị sang chính phòng hiện tại");
  // Kiểm tra tồn kho phòng đi
  const fromRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND device_type = $2`,
    [from_room_id, equipment_id]
  );
  if (!fromRes.rows[0] || fromRes.rows[0].quantity < quantity)
    throw new Error("Không đủ tồn kho phòng đi");
  // Kiểm tra phòng đến đã có thiết bị cùng loại chưa (nếu nghiệp vụ yêu cầu, có thể bỏ qua nếu muốn cộng dồn)
  // Đã xử lý ở frontend, nhưng vẫn nên kiểm tra ở backend
  // Trừ tồn kho phòng đi
  await pool.query(
    `UPDATE room_devices SET quantity = quantity - $1 WHERE room_id = $2 AND device_type = $3`,
    [quantity, from_room_id, equipment_id]
  );
  // Cộng tồn kho phòng đến (nếu chưa có thì tạo mới)
  const toRes = await pool.query(
    `SELECT * FROM room_devices WHERE room_id = $1 AND device_type = $2`,
    [to_room_id, equipment_id]
  );
  if (toRes.rows[0]) {
    await pool.query(
      `UPDATE room_devices SET quantity = quantity + $1 WHERE room_id = $2 AND device_type = $3`,
      [quantity, to_room_id, equipment_id]
    );
  } else {
    // Lấy thông tin thiết bị từ phòng đi để clone sang phòng đến
    const {
      device_name,
      status = "working",
      note = null,
      images = null,
    } = fromRes.rows[0];
    await pool.query(
      `INSERT INTO room_devices (device_name, device_type, status, room_id, note, images, quantity) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [device_name, equipment_id, status, to_room_id, note, images, quantity]
    );
  }
  return true;
};
