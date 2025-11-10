import pool from "../db.js";

export const getRoomTypes = async () => {
  const result = await pool.query(`
    SELECT 
      rt.*,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail
    FROM room_types rt
  `);
  // Parse JSON fields for each row
  return result.rows.map((row) => {
    if (row.images) row.images = JSON.parse(row.images);
    if (row.amenities) row.amenities = JSON.parse(row.amenities);
    return row;
  });
};

export const createRoomType = async (data) => {
  const { name, description, thumbnail, images, amenities } = data;
  const result = await pool.query(
    "INSERT INTO room_types (name, description, thumbnail, images, amenities) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [
      name,
      description,
      thumbnail || null,
      images ? JSON.stringify(images) : null,
      amenities ? JSON.stringify(amenities) : null,
    ]
  );
  console.log(result);
  return result.rows[0];
};

export const getRoomTypeById = async (id) => {
  const result = await pool.query(
    `SELECT 
      rt.*,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail
    FROM room_types rt 
    WHERE rt.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (row) {
    // Parse JSON fields
    if (row.images) row.images = JSON.parse(row.images);
    if (row.amenities) row.amenities = JSON.parse(row.amenities);
  }
  return row;
};

export const updateRoomType = async (id, data) => {
  const { name, description, amenities } = data;
  const result = await pool.query(
    "UPDATE room_types SET name = $1, description = $2, amenities = $3 WHERE id = $4 RETURNING *",
    [name, description, amenities ? JSON.stringify(amenities) : null, id]
  );

  // Get thumbnail from room_type_images
  const withThumbnail = await pool.query(
    `SELECT 
      rt.*,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail
    FROM room_types rt 
    WHERE rt.id = $1`,
    [id]
  );

  return withThumbnail.rows[0];
};

export const deleteRoomType = async (id) => {
  const resuit = await pool.query(
    "DELETE FROM room_types WHERE id = $1 RETURNING *",
    [id]
  );
  return resuit.rows[0];
};

export const existsRoomTypeWithName = async (name, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM room_types WHERE name = $1 AND id <> $2 LIMIT 1",
      [name, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM room_types WHERE name = $1 LIMIT 1",
    [name]
  );
  return res.rowCount > 0;
};
