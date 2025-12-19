import pool from "../db.js";

export const getIncidentsByBooking = async (booking_id) => {
  const result = await pool.query(
    `SELECT bi.*, me.name as equipment_name, me.type as equipment_type
     FROM booking_incidents bi
     JOIN master_equipments me ON bi.equipment_id = me.id
     WHERE bi.booking_id = $1
     ORDER BY bi.id`,
    [booking_id]
  );
  return result.rows;
};

export const createIncident = async (data) => {
  const { booking_id, room_id, equipment_id, quantity, reason, amount } = data;
  const result = await pool.query(
    `INSERT INTO booking_incidents (booking_id, room_id, equipment_id, quantity, reason, amount)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [booking_id, room_id, equipment_id, quantity, reason, amount]
  );
  return result.rows[0];
};

export const deleteIncident = async (id) => {
  const result = await pool.query(
    `DELETE FROM booking_incidents WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};
