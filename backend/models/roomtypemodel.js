import pool from "../db.js";

export const getRoomTypes = async () => {
  const result = await pool.query(`
    SELECT 
      rt.id,
      rt.name,
      rt.description,
      rt.created_at,
      rt.max_adults,
      rt.max_children,
      rt.capacity,
      (SELECT image_url FROM room_type_images WHERE room_type_id = rt.id AND is_thumbnail = true LIMIT 1) as thumbnail,
      rt.price,
      rt.adult_surcharge,
      rt.child_surcharge,
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
  `);
  // Group devices for each room type
  const roomTypes = {};
  for (const row of result.rows) {
    if (!roomTypes[row.id]) {
      roomTypes[row.id] = {
        id: row.id,
        name: row.name,
        description: row.description,
        created_at: row.created_at,
        max_adults: row.max_adults,
        max_children: row.max_children,
        capacity: row.capacity,
        thumbnail: row.thumbnail,
        price: row.price,
        adult_surcharge: row.adult_surcharge,
        child_surcharge: row.child_surcharge,
        devices_id: row.devices_id,
        devices: [],
      };
    }
    if (row.device_id) {
      roomTypes[row.id].devices.push({
        id: row.device_id,
        name: row.device_name,
        type: row.device_type,
        fee: row.device_fee,
        description: row.device_description,
      });
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
    adult_surcharge,
    child_surcharge,
    devices_id,
  } = data;
  const result = await pool.query(
    "INSERT INTO room_types (name, description, thumbnail, images, capacity, max_adults, max_children, price, adult_surcharge, child_surcharge, devices_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
    [
      name,
      description,
      thumbnail || null,
      images ? JSON.stringify(images) : null,
      capacity,
      max_adults,
      max_children,
      price,
      adult_surcharge || 0,
      child_surcharge || 0,
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
      rt.adult_surcharge,
      rt.child_surcharge,
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
    adult_surcharge,
    child_surcharge,
    devices_id,
  } = data;
  const result = await pool.query(
    "UPDATE room_types SET name = $1, description = $2, capacity = $3, max_adults = $4, max_children = $5, price = $6, adult_surcharge = $7, child_surcharge = $8, devices_id = $9 WHERE id = $10 RETURNING *",
    [
      name,
      description,
      capacity,
      max_adults,
      max_children,
      price,
      adult_surcharge !== undefined ? adult_surcharge : null,
      child_surcharge !== undefined ? child_surcharge : null,
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
      rt.adult_surcharge,
      rt.child_surcharge,
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
