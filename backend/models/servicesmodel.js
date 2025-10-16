import pool from "../db.js";

export const getServices = async () => {
  const resuit = await pool.query("SELECT * FROM services");
  return resuit.rows;
};

export const getServiceById = async (id) => {
  const resuit = await pool.query("SELECT * FROM services WHERE id = $1", [id]);
  return resuit.rows[0];
};

export const createService = async (data) => {
  const { name, description, price } = data;
  const resuit = await pool.query(
    "INSERT INTO services (name, description, price) VALUES ($1, $2, $3) RETURNING *",
    [name, description, price]
  );
  return resuit.rows[0];
};

export const updateService = async (id, data) => {
  const { name, description, price } = data;
  const resuit = await pool.query(
    "UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *",
    [name, description, price, id]
  );
  return resuit.rows[0];
};

export const deleteService = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM services WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};

export const existsServiceWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM services WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM services WHERE name = $1 LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
