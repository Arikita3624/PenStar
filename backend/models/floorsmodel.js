import pool from "../db.js";

export const getFloors = async () => {
  const resuit = await pool.query("SELECT * FROM floors");
  return resuit.rows;
};

export const getFloorID = async (id) => {
  const resuit = await pool.query("SELECT * FROM floors WHERE id = $1", [id]);
  console.log(resuit);
  return resuit.rows[0];
};

export const createFloor = async (data) => {
  const { name, description } = data;
  const resuit = await pool.query(
    "INSERT INTO floors (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  console.log(resuit);
  return resuit.rows[0];
};

export const updateFloor = async (id, data) => {
  const { name, description } = data;
  const resuit = await pool.query(
    "UPDATE floors SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name, description, id]
  );
  return resuit.rows[0];
};

export const deleteFloor = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM floors WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};

export const existsFloorWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM floors WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query("SELECT 1 FROM floors WHERE name = $1 LIMIT 1", [
    name,
  ]);
  return res.rowCount > 0;
};
