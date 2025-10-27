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
    short_desc,
    long_desc,
    status,
    thumbnail,
    floor_id,
  } = data;
  const resuit = await pool.query(
    `INSERT INTO rooms (name, type_id, price, capacity, short_desc, long_desc, status, thumbnail, floor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      name,
      type_id,
      price,
      capacity,
      short_desc,
      long_desc,
      status,
      thumbnail,
      floor_id,
    ]
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
    short_desc,
    long_desc,
    status,
    thumbnail,
    floor_id,
  } = data;
  const resuit = await pool.query(
    `UPDATE rooms SET name = $1, type_id = $2, price = $3, capacity = $4, short_desc = $5, long_desc = $6, status = $7, thumbnail = $8, floor_id = $9
     WHERE id = $10 RETURNING *`,
    [
      name,
      type_id,
      price,
      capacity,
      short_desc,
      long_desc,
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

// Backwards-compatible wrappers (camelCase) kept, but internal helpers accept snake_case keys
export const countRoomsByTypeId = async (typeId) => {
  return countRoomsBy_type_id(typeId);
};

export const countRoomsByFloorId = async (floorId) => {
  return countRoomsBy_floor_id(floorId);
};

export const countRoomsBy_type_id = async (type_id) => {
  const resuit = await pool.query(
    "SELECT COUNT(*)::int AS count FROM rooms WHERE type_id = $1",
    [type_id]
  );
  return resuit.rows[0]?.count ?? 0;
};

export const countRoomsBy_floor_id = async (floor_id) => {
  const resuit = await pool.query(
    "SELECT COUNT(*)::int AS count FROM rooms WHERE floor_id = $1",
    [floor_id]
  );
  return resuit.rows[0]?.count ?? 0;
};

export const existsRoomWithNameAndType = async (
  name,
  type_id,
  excludeId = null
) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM rooms WHERE name = $1 AND type_id = $2 AND id <> $3 LIMIT 1",
      [name, type_id, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM rooms WHERE name = $1 AND type_id = $2 LIMIT 1",
    [name, type_id]
  );
  return res.rowCount > 0;
};

// Check trùng tên phòng tuyệt đối (không phụ thuộc type_id)
export const existsRoomWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM rooms WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM rooms WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
