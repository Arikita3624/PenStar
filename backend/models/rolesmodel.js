import pool from "../db.js";

export const getRoles = async () => {
  const res = await pool.query("SELECT * FROM roles ORDER BY id");
  return res.rows;
};

export const getRoleById = async (id) => {
  const res = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
  return res.rows[0];
};

export const createRole = async (data) => {
  const { name, description } = data;
  const res = await pool.query(
    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  return res.rows[0];
};

export const updateRole = async (id, data) => {
  const { name, description } = data;
  const res = await pool.query(
    "UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name, description, id]
  );
  return res.rows[0];
};

export const deleteRole = async (id) => {
  const res = await pool.query("DELETE FROM roles WHERE id = $1 RETURNING *", [
    id,
  ]);
  return res.rows[0];
};

export const existsRoleWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM roles WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query("SELECT 1 FROM roles WHERE name = $1 LIMIT 1", [
    name,
  ]);
  return res.rowCount > 0;
};
