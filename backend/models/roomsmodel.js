import pool from "../db.js";

// Độ tuổi quy chuẩn để tính là trẻ em
export const CHILD_AGE_LIMIT = 8; // Trẻ em: < 8 tuổi, Người lớn: >= 8 tuổi

export const getRooms = async () => {
  const resuit = await pool.query(`
    SELECT r.*, 
           rt.name as type_name,
           f.name as floor_name
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    ORDER BY r.id
  `);
  return resuit.rows;
};

export const getRoomID = async (id) => {
  const resuit = await pool.query(
    `
    SELECT r.*, 
           rt.name as type_name,
           f.name as floor_name
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    LEFT JOIN floors f ON r.floor_id = f.id
    WHERE r.id = $1
  `,
    [id]
  );
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

// Check if room has active bookings (đang được book)
// Active = reserved (1) hoặc checked_in (2)
// KHÔNG bao gồm checked_out (3) vì đã trả phòng
export const hasActiveBookings = async (roomId) => {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM booking_items bi
     JOIN bookings b ON bi.booking_id = b.id
     WHERE bi.room_id = $1
       AND b.stay_status_id IN (1, 2, 6)`,
    [roomId]
  );
  return parseInt(result.rows[0].count) > 0;
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

// Tìm kiếm phòng trống theo thời gian và yêu cầu
export const searchAvailableRooms = async ({
  check_in,
  check_out,
  room_type_id = null,
  floor_id = null,
  num_adults = 1,
  num_children = 0,
}) => {
  console.log("🔍 Search params:", {
    check_in,
    check_out,
    room_type_id,
    floor_id,
    num_adults,
    num_children,
  });

  const totalGuests = num_adults + num_children;

  // Simplified query - chỉ check available và không conflict booking
  let query = `
    SELECT DISTINCT r.*, rt.name as type_name, rt.max_adults, rt.max_children, rt.base_occupancy
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    WHERE r.status = 'available'
      AND r.capacity >= $1
  `;

  const params = [totalGuests];
  console.log("📦 Initial params:", params);
  let paramIndex = 2;

  // Filter theo loại phòng nếu có
  if (room_type_id) {
    query += ` AND r.type_id = $${paramIndex}`;
    params.push(room_type_id);
    paramIndex++;
  }

  // Filter theo tầng nếu có
  if (floor_id) {
    query += ` AND r.floor_id = $${paramIndex}`;
    params.push(floor_id);
    paramIndex++;
  }

  // Loại trừ phòng đã có booking conflict
  query += `
    AND NOT EXISTS (
      SELECT 1 FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.room_id = r.id
        AND b.stay_status_id IN (1, 2, 3) -- reserved, approved, checked_in
        AND NOT (bi.check_out <= $${paramIndex} OR bi.check_in >= $${
    paramIndex + 1
  })
    )
  `;
  params.push(check_in, check_out);

  // Sắp xếp theo tầng (floor_id) và tên phòng (name) tăng dần
  // Điều này đảm bảo: Tầng 2 trước, trong cùng tầng thì P301 < P302 < P303...
  query += ` ORDER BY r.floor_id ASC, r.name ASC`;

  console.log("📝 Final query:", query);
  console.log("📦 Final params:", params);

  const result = await pool.query(query, params);
  console.log(`✅ Found ${result.rows.length} rooms`);

  return result.rows;
};

// Analyze availability reasons for a given room type and date range
export const analyzeRoomAvailability = async ({
  check_in,
  check_out,
  room_type_id = null,
  num_adults = 1,
  num_children = 0,
}) => {
  // total rooms of this type
  const totalRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM rooms WHERE type_id = $1`,
    [room_type_id]
  );
  const total = totalRes.rows[0]?.total || 0;

  // rooms with status = 'available' and no booking conflict
  const availableRes = await pool.query(
    `SELECT r.* FROM rooms r
     WHERE r.type_id = $1 AND r.status = 'available'
       AND NOT EXISTS (
         SELECT 1 FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.room_id = r.id
           AND b.stay_status_id IN (1,2,3)
           AND NOT (bi.check_out <= $2 OR bi.check_in >= $3)
       )
     ORDER BY r.floor_id, r.name LIMIT 10`,
    [room_type_id, check_in, check_out]
  );
  const available = availableRes.rows || [];

  // rooms of this type but status != 'available'
  const blockedStatusRes = await pool.query(
    `SELECT r.* FROM rooms r WHERE r.type_id = $1 AND r.status <> 'available' ORDER BY r.floor_id, r.name LIMIT 10`,
    [room_type_id]
  );
  const blocked_by_status = blockedStatusRes.rows || [];

  // rooms that are available by status but blocked due to booking conflict
  const blockedConflictRes = await pool.query(
    `SELECT r.* FROM rooms r
     WHERE r.type_id = $1 AND r.status = 'available'
       AND EXISTS (
         SELECT 1 FROM booking_items bi
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.room_id = r.id
           AND b.stay_status_id IN (1,2,3)
           AND NOT (bi.check_out <= $2 OR bi.check_in >= $3)
       )
     ORDER BY r.floor_id, r.name LIMIT 10`,
    [room_type_id, check_in, check_out]
  );
  const blocked_by_conflict = blockedConflictRes.rows || [];

  return {
    total: Number(total),
    available_count: available.length,
    available_sample: available,
    blocked_by_status_count: blocked_by_status.length,
    blocked_by_status_sample: blocked_by_status,
    blocked_by_conflict_count: blocked_by_conflict.length,
    blocked_by_conflict_sample: blocked_by_conflict,
  };
};
