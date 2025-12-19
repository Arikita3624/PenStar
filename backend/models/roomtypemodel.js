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
        rt.base_adults,
        rt.base_children,
        rt.extra_adult_fee,
        rt.extra_child_fee,
        rt.child_age_limit,
        rt.thumbnail,
        rt.price,
        rt.bed_type,
        rt.view_direction,
        rt.free_amenities,
        rt.paid_amenities,
        rt.room_size,
        rt.policies
      FROM room_types rt
    `);
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

  // Lấy devices qua bảng room_type_devices
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
        // devices: [],
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
    capacity,
    base_adults,
    base_children,
    extra_adult_fee,
    extra_child_fee,
    child_age_limit,
    price,
    bed_type,
    view_direction,
    free_amenities,
    paid_amenities,
    room_size,
    policies,
  } = data;
  const result = await pool.query(
    `INSERT INTO room_types (
      name, description, capacity, base_adults, base_children, extra_adult_fee, extra_child_fee, child_age_limit, thumbnail, price, bed_type, view_direction, free_amenities, paid_amenities, room_size, policies
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    ) RETURNING *`,
    [
      name,
      description,
      capacity,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      thumbnail || null,
      price,
      bed_type,
      view_direction,
      // amenities đã bị loại bỏ
      free_amenities || null,
      paid_amenities || null,
      room_size,
      policies ? JSON.stringify(policies) : null,
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
      rt.capacity,
      rt.base_adults,
      rt.base_children,
      rt.extra_adult_fee,
      rt.extra_child_fee,
      rt.child_age_limit,
      rt.thumbnail,
      rt.price,
      rt.bed_type,
      rt.view_direction,
      rt.free_amenities,
      rt.paid_amenities,
      rt.room_size,
      rt.policies
    FROM room_types rt
    WHERE rt.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (row) {
    if (row.policies && typeof row.policies === "string")
      row.policies = JSON.parse(row.policies);
    // row.devices = await getDevicesByRoomType(row.id);
  }
  return row;
};

export const updateRoomType = async (id, data) => {
  let {
    name,
    description,
    capacity,
    base_adults,
    base_children,
    extra_adult_fee,
    extra_child_fee,
    child_age_limit,
    thumbnail,
    price,
    bed_type,
    view_direction,

    free_amenities,
    paid_amenities,
    room_size,
    policies,
  } = data;

  // Nếu thumbnail không được gửi lên, lấy lại từ DB
  if (typeof thumbnail === "undefined") {
    const old = await pool.query(
      "SELECT thumbnail FROM room_types WHERE id = $1",
      [id]
    );
    thumbnail = old.rows[0]?.thumbnail || null;
  }

  const result = await pool.query(
    `UPDATE room_types SET
      name = $1,
      description = $2,
      capacity = $3,
      base_adults = $4,
      base_children = $5,
      extra_adult_fee = $6,
      extra_child_fee = $7,
      child_age_limit = $8,
      thumbnail = $9,
      price = $10,
      bed_type = $11,
      view_direction = $12,
      free_amenities = $14,
      paid_amenities = $15,
      room_size = $16,
      policies = $18
    WHERE id = $19 RETURNING *`,
    [
      name,
      description,
      capacity,
      base_adults,
      base_children,
      extra_adult_fee,
      extra_child_fee,
      child_age_limit,
      thumbnail || null,
      price,
      bed_type,
      view_direction,
      free_amenities || null,
      paid_amenities || null,
      room_size,
      policies ? JSON.stringify(policies) : null,
      id,
    ]
  );
  const row = result.rows[0];
  if (row) {
    row.devices = await getDevicesByRoomType(row.id);
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
