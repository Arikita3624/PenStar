export const getAllRoomTypeEquipments = async () => {
  const result = await pool.query(
    `SELECT rte.*, me.name as equipment_name, me.type as equipment_type, me.compensation_price, me.import_price
     FROM room_type_equipments rte
     JOIN master_equipments me ON rte.master_equipment_id = me.id
     ORDER BY rte.id`
  );
  return result.rows;
};
import pool from "../db.js";

export const getEquipmentsByRoomType = async (room_type_id) => {
  const result = await pool.query(
    `SELECT rte.*, me.name as equipment_name, me.type as equipment_type, me.compensation_price, me.import_price
     FROM room_type_equipments rte
     JOIN master_equipments me ON rte.master_equipment_id = me.id
     WHERE rte.room_type_id = $1
     ORDER BY rte.id`,
    [room_type_id]
  );
  return result.rows;
};

export const addEquipmentToRoomType = async (
  room_type_id,
  master_equipment_id,
  quantity = 1
) => {
  const result = await pool.query(
    `INSERT INTO room_type_equipments (room_type_id, master_equipment_id, quantity)
     VALUES ($1, $2, $3) ON CONFLICT (room_type_id, master_equipment_id) DO UPDATE SET quantity = EXCLUDED.quantity
     RETURNING *`,
    [room_type_id, master_equipment_id, quantity]
  );
  return result.rows[0];
};

export const updateEquipmentQuantity = async (id, quantity) => {
  const result = await pool.query(
    `UPDATE room_type_equipments SET quantity = $1 WHERE id = $2 RETURNING *`,
    [quantity, id]
  );
  return result.rows[0];
};

export const removeEquipmentFromRoomType = async (id) => {
  const result = await pool.query(
    `DELETE FROM room_type_equipments WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};
