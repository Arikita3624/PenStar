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
