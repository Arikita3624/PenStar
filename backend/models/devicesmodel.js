import pool from "../db.js";

export const getDevices = async () => {
  const result = await pool.query("SELECT * FROM devices ORDER BY id");
  return result.rows;
};

export const getDeviceById = async (id) => {
  const result = await pool.query("SELECT * FROM devices WHERE id = $1", [id]);
  return result.rows[0];
};

export const createDevice = async (data) => {
  const { name, type, fee, description } = data;
  const result = await pool.query(
    "INSERT INTO devices (name, type, fee, description) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, type, fee || 0, description || null]
  );
  return result.rows[0];
};

export const updateDevice = async (id, data) => {
  const { name, type, fee, description } = data;
  const result = await pool.query(
    "UPDATE devices SET name = $1, type = $2, fee = $3, description = $4 WHERE id = $5 RETURNING *",
    [name, type, fee || 0, description || null, id]
  );
  return result.rows[0];
};

export const deleteDevice = async (id) => {
  const result = await pool.query(
    "DELETE FROM devices WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
