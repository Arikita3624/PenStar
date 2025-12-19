import pool from "../db.js";

export const getAllEquipments = async () => {
  const result = await pool.query(
    "SELECT * FROM master_equipments ORDER BY id"
  );
  return result.rows;
};

export const getEquipmentById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM master_equipments WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createEquipment = async (data) => {
  const { name, type, import_price, compensation_price, total_stock } = data;
  const result = await pool.query(
    `INSERT INTO master_equipments (name, type, import_price, compensation_price, total_stock)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, type, import_price, compensation_price, total_stock]
  );
  return result.rows[0];
};

export const updateEquipment = async (id, data) => {
  const { name, type, import_price, compensation_price, total_stock } = data;
  const result = await pool.query(
    `UPDATE master_equipments SET
      name = $1,
      type = $2,
      import_price = $3,
      compensation_price = $4,
      total_stock = $5
     WHERE id = $6 RETURNING *`,
    [name, type, import_price, compensation_price, total_stock, id]
  );
  return result.rows[0];
};

export const deleteEquipment = async (id) => {
  const result = await pool.query(
    "DELETE FROM master_equipments WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
