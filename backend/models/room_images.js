import pool from "../db.js";

// CRUD operations for room_images
export const getRoomImages = async () => {
  const res = await pool.query(
    "SELECT id, room_id, image_url, is_thumbnail, created_at FROM room_images"
  );
  return res.rows;
};

export const getRoomImageById = async (id) => {
  const res = await pool.query(
    "SELECT id, room_id, image_url, is_thumbnail, created_at FROM room_images WHERE id = $1",
    [id]
  );
  return res.rows[0];
};

export const getRoomImagesByRoomId = async (roomId) => {
  const res = await pool.query(
    "SELECT id, room_id, image_url, is_thumbnail, created_at FROM room_images WHERE room_id = $1",
    [roomId]
  );
  return res.rows;
};

export const createRoomImage = async (data) => {
  const { room_id, image_url, is_thumbnail } = data;
  const res = await pool.query(
    `INSERT INTO room_images (room_id, image_url, is_thumbnail)
     VALUES ($1, $2, $3) RETURNING id, room_id, image_url, is_thumbnail, created_at, updated_at`,
    [room_id, image_url, is_thumbnail]
  );
  return res.rows[0];
};

export const updateRoomImage = async (id, data) => {
  const { room_id, image_url, is_thumbnail } = data;
  const res = await pool.query(
    `UPDATE room_images SET room_id = $1, image_url = $2, is_thumbnail = $3
     WHERE id = $4 RETURNING id, room_id, image_url, is_thumbnail, created_at`,
    [room_id, image_url, is_thumbnail, id]
  );
  return res.rows[0];
};

export const deleteRoomImage = async (id) => {
  const res = await pool.query(
    "DELETE FROM room_images WHERE id = $1 RETURNING id",
    [id]
  );
  return res.rows[0];
};
