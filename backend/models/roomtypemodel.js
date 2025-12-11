import pool from "../db.js";

export const getRoomTypes = async () => {
  let result;
  try {
    result = await pool.query(`
    SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.capacity,
      rt.room_size,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.bed_type,
      rt.view_direction,
      rt.free_amenities,
      rt.paid_amenities,
      rt.base_adults,
      rt.base_children,
      rt.extra_adult_fee,
      rt.extra_child_fee,
      rt.child_age_limit,
      rt.policies
    FROM room_types rt
    `);
    console.log("Kết quả truy vấn room_types:", result.rows);
  } catch (err) {
    console.error("Lỗi truy vấn room_types:", err);
    throw err;
  }

  // Get all room type images
  const imagesResult = await pool.query(`
    SELECT room_type_id, image_url, is_thumbnail
    FROM room_type_images
    ORDER BY room_type_id, is_thumbnail DESC, id ASC
  `);

  // Group images by room_type_id
  const imagesByRoomType = {};
  for (const img of imagesResult.rows) {
    if (!imagesByRoomType[img.room_type_id]) {
      imagesByRoomType[img.room_type_id] = [];
    }
    imagesByRoomType[img.room_type_id].push(img.image_url);
  }

  // Group devices for each room type
  const roomTypes = {};
  for (const row of result.rows) {
    if (!roomTypes[row.id]) {
      roomTypes[row.id] = {
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        capacity: row.capacity,
        room_size: row.room_size,
        thumbnail: row.thumbnail,
        images: imagesByRoomType[row.id] || [],
        price: row.price,
        bed_type: row.bed_type,
        view_direction: row.view_direction,
        free_amenities: row.free_amenities,
        paid_amenities: row.paid_amenities,
        base_adults: row.base_adults,
        base_children: row.base_children,
        extra_adult_fee: row.extra_adult_fee,
        extra_child_fee: row.extra_child_fee,
        child_age_limit: row.child_age_limit,
        policies: row.policies,
      };
    }
  }
  return Object.values(roomTypes);
};

export const createRoomType = async (data) => {
  const {
    name,
    description,
    thumbnail,
    images,
    capacity,
    max_adults,
    max_children,
    price,
    devices_id,
  } = data;
  const result = await pool.query(
    "INSERT INTO room_types (name, description, thumbnail, images, capacity, max_adults, max_children, price, devices_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      name,
      description,
      thumbnail || null,
      images ? JSON.stringify(images) : null,
      capacity,
      max_adults,
      max_children,
      price,
      devices_id || [],
    ]
  );
  return result.rows[0];
};

export const getRoomTypeById = async (id) => {
  const result = await pool.query(
    `SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.max_adults,
      rt.max_children,
      rt.capacity,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.devices_id,
      rt.bed_type,
      rt.view_direction,
      rt.safety_info,
      rt.free_amenities,
      rt.paid_amenities,
      rt.base_adults,
      rt.base_children,
      rt.extra_adult_fee,
      rt.extra_child_fee,
      rt.child_age_limit,
      rt.policies,
      d.id as device_id,
      d.name as device_name,
      d.type as device_type,
      d.fee as device_fee,
      d.description as device_description
    FROM room_types rt
    LEFT JOIN LATERAL (
      SELECT * FROM devices WHERE id = ANY(rt.devices_id)
    ) d ON TRUE
    WHERE rt.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (row) {
    // Parse JSON fields
    if (row.images) row.images = JSON.parse(row.images);
    // Collect all devices
    const devices = [];
    for (const r of result.rows) {
      if (r.device_id) {
        devices.push({
          id: r.device_id,
          name: r.device_name,
          type: r.device_type,
          fee: r.device_fee,
          description: r.device_description,
        });
      }
    }
    row.devices = devices;
  }
  return row;
};

export const updateRoomType = async (id, data) => {
  const {
    name,
    description,
    capacity,
    max_adults,
    max_children,
    price,
    devices_id,
  } = data;
  const result = await pool.query(
    "UPDATE room_types SET name = $1, description = $2, capacity = $3, max_adults = $4, max_children = $5, price = $6, devices_id = $7 WHERE id = $8 RETURNING *",
    [
      name,
      description,
      capacity,
      max_adults,
      max_children,
      price,
      devices_id || [],
      id,
    ]
  );

  // Get thumbnail and devices
  const withDevices = await pool.query(
    `SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.max_adults,
      rt.max_children,
      rt.capacity,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.devices_id,
      d.id as device_id,
      d.name as device_name,
      d.type as device_type,
      d.fee as device_fee,
      d.description as device_description
    FROM room_types rt
    LEFT JOIN LATERAL (
      SELECT * FROM devices WHERE id = ANY(rt.devices_id)
    ) d ON TRUE
    WHERE rt.id = $1`,
    [id]
  );
  const row = withDevices.rows[0];
  if (row) {
    const devices = [];
    for (const r of withDevices.rows) {
      if (r.device_id) {
        devices.push({
          id: r.device_id,
          name: r.device_name,
          type: r.device_type,
          fee: r.device_fee,
          description: r.device_description,
        });
      }
    }
    row.devices = devices;
  }
  return row;
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
