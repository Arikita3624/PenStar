import pool from "../db.js";

export const getRoomTypeImages = async () => {
  const result = await pool.query(
    "SELECT * FROM room_type_images ORDER BY id ASC"
  );
  return result.rows;
};

export const getRoomTypeImageById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM room_type_images WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const getRoomTypeImagesByRoomTypeId = async (roomTypeId) => {
  const result = await pool.query(
    "SELECT * FROM room_type_images WHERE room_type_id = $1 ORDER BY is_thumbnail DESC, id ASC",
    [roomTypeId]
  );
  return result.rows;
};

export const createRoomTypeImage = async (data) => {
  const { room_type_id, image_url, is_thumbnail } = data;
  const result = await pool.query(
    "INSERT INTO room_type_images (room_type_id, image_url, is_thumbnail) VALUES ($1, $2, $3) RETURNING *",
    [room_type_id, image_url, is_thumbnail || false]
  );
  return result.rows[0];
};

export const updateRoomTypeImage = async (id, data) => {
  const { image_url, is_thumbnail } = data;
  const result = await pool.query(
    "UPDATE room_type_images SET image_url = COALESCE($1, image_url), is_thumbnail = COALESCE($2, is_thumbnail), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
    [image_url, is_thumbnail, id]
  );
  return result.rows[0];
};

export const deleteRoomTypeImage = async (id) => {
  const result = await pool.query(
    "DELETE FROM room_type_images WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
