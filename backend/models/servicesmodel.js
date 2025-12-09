import pool from "../db.js";

export const getServices = async () => {
  const result = await pool.query(`
    SELECT s.*, st.name as service_type_name, st.description as service_type_description
    FROM services s
    LEFT JOIN service_types st ON s.service_type_code = st.code
    ORDER BY s.id
  `);
  return result.rows;
};

export const getServiceById = async (id) => {
  const result = await pool.query(
    `
    SELECT s.*, st.name as service_type_name, st.description as service_type_description
    FROM services s
    LEFT JOIN service_types st ON s.service_type_code = st.code
    WHERE s.id = $1
  `,
    [id]
  );
  return result.rows[0];
};

export const createService = async (data) => {
  const {
    name,
    description,
    price,
    service_type_code = "optional",
    is_included = false,
    image_url = null,
    thumbnail = null,
    note = null,
  } = data;
  const result = await pool.query(
    `INSERT INTO services (name, description, price, service_type_code, is_included, image_url, thumbnail, note) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      name,
      description,
      price,
      service_type_code,
      is_included,
      image_url,
      thumbnail,
      note,
    ]
  );
  return result.rows[0];
};

export const updateService = async (id, data) => {
  const {
    name,
    description,
    price,
    service_type_code,
    is_included,
    image_url,
    thumbnail,
    note,
  } = data;

  const result = await pool.query(
    `UPDATE services 
     SET name = $1, description = $2, price = $3, service_type_code = $4, 
         is_included = $5, image_url = $6, thumbnail = $7, note = $8, updated_at = CURRENT_TIMESTAMP
     WHERE id = $9 RETURNING *`,
    [
      name,
      description,
      price,
      service_type_code,
      is_included,
      image_url,
      thumbnail,
      note,
      id,
    ]
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
