import pool from "../db.js";

export const getRooms = async () => {
  const resuit = await pool.query("SELECT * FROM rooms");
  return resuit.rows;
};

export const getRoomID = async (id) => {
  const resuit = await pool.query("SELECT * FROM rooms WHERE id = $1", [id]);
  console.log(resuit);
  return resuit.rows[0];
};

export const createRoom = async (data) => {
  const {
    name,
    type_id,
    price,
    capacity,
    description,
    status,
    thumbnail,
    floor_id,
  } = data;
  const resuit = await pool.query(
    "INSERT INTO rooms (name, type_id, price, capacity, description, status, thumbnail, floor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [name, type_id, price, capacity, description, status, thumbnail, floor_id]
  );
  console.log(resuit);
  return resuit.rows[0];
};

export const updateRoom = async (id, data) => {
  const {
    name,
    type_id,
    price,
    capacity,
    description,
    status,
    thumbnail,
    floor_id,
  } = data;
  const resuit = await pool.query(
    "UPDATE rooms SET name = $1, type_id = $2, price = $3, capacity = $4, description = $5, status = $6, thumbnail = $7, floor_id = $8 WHERE id = $9 RETURNING *",
    [
      name,
      type_id,
      price,
      capacity,
      description,
      status,
      thumbnail,
      floor_id,
      id,
    ]
  );
  console.log(resuit);
  return resuit.rows[0];
};

export const deleteRoom = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM rooms WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};
