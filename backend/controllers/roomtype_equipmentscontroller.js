import pool from "../db.js";

// Lấy danh sách thiết bị tiêu chuẩn của một loại phòng
export const getRoomTypeEquipments = async (req, res) => {
  const roomTypeId = req.params.id;
  try {
    const result = await pool.query(
      `
      SELECT rte.id, rte.min_quantity, rte.max_quantity,
             me.id AS equipment_id, me.name AS equipment_name, me.type AS equipment_type
      FROM room_type_equipments rte
      JOIN master_equipments me ON rte.equipment_type_id = me.id
      WHERE rte.room_type_id = $1
      ORDER BY me.name
    `,
      [roomTypeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
