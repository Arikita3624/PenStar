import pool from "../db.js";

export const getServices = async () => {
  const result = await pool.query(`
    SELECT * FROM services ORDER BY id
  `);
  return result.rows;
};

export const getServiceById = async (id) => {
  const result = await pool.query(`SELECT * FROM services WHERE id = $1`, [id]);
  return result.rows[0];
};

export const createService = async (data) => {
  const {
    name,
    description,
    price,
    is_included = false,
    image_url = null,
    thumbnail = null,
    note = null,
  } = data;
  const result = await pool.query(
    `INSERT INTO services (name, description, price, is_included, image_url, thumbnail, note) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, description, price, is_included, image_url, thumbnail, note]
  );
  return result.rows[0];
};

export const updateService = async (id, data) => {
  const { name, description, price, is_included, image_url, thumbnail, note } =
    data;

  const result = await pool.query(
    `UPDATE services 
     SET name = $1, description = $2, price = $3, 
         is_included = $4, image_url = $5, thumbnail = $6, note = $7, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [name, description, price, is_included, image_url, thumbnail, note, id]
  );
  return result.rows[0];
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
