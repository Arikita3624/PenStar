import pool from "../db.js";

export const getServiceTypes = async () => {
  const result = await pool.query(`
    SELECT * FROM service_types 
    WHERE is_active = TRUE 
    ORDER BY display_order, id
  `);
  return result.rows;
};

export const getServiceTypeByCode = async (code) => {
  const result = await pool.query(
    "SELECT * FROM service_types WHERE code = $1",
    [code]
  );
  return result.rows[0];
};

export const createServiceType = async (data) => {
  const { code, name, description, display_order = 0 } = data;
  const result = await pool.query(
    `INSERT INTO service_types (code, name, description, display_order) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [code, name, description, display_order]
  );
  return result.rows[0];
};

export const updateServiceType = async (code, data) => {
  const { name, description, display_order, is_active } = data;
  const result = await pool.query(
    `UPDATE service_types 
     SET name = $1, description = $2, display_order = $3, is_active = $4
     WHERE code = $5 RETURNING *`,
    [name, description, display_order, is_active, code]
  );
  return result.rows[0];
};

export const deleteServiceType = async (code) => {
  const result = await pool.query(
    "DELETE FROM service_types WHERE code = $1 RETURNING *",
    [code]
  );
  return result.rows[0];
};
