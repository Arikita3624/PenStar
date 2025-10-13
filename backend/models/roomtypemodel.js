import pool from "../db.js";

export const getRoomTypes = async () => {
  const resuit = await pool.query("SELECT * FROM room_types");
  return resuit.rows;
};

export const createRoomType = async (data) => {
  const { name, description } = data;
  const resuit = await pool.query(
    "INSERT INTO room_types (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  console.log(resuit);
  return resuit.rows[0];
};

export const getRoomTypeById = async (id) => {
  const resuit = await pool.query("SELECT * FROM room_types WHERE id = $1", [
    id,
  ]);
  return resuit.rows[0];
};

export const updateRoomType = async (id, data) => {
  const { name, description } = data;
  const resuit = await pool.query(
    "UPDATE room_types SET name = $1, description = $2 WHERE id = $3 RETURNING *",
    [name, description, id]
  );
  return resuit.rows[0];
};

export const deleteRoomType = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM room_types WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};
