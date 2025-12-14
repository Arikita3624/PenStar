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
  const { name, type_id, short_desc, long_desc, status, thumbnail, floor_id } =
    data;
  const resuit = await pool.query(
    `INSERT INTO rooms (name, type_id, short_desc, long_desc, status, thumbnail, floor_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [name, type_id, short_desc, long_desc, status, thumbnail, floor_id]
  );
  console.log(resuit);
  return resuit.rows[0];
};

export const updateRoom = async (id, data) => {
  const { name, type_id, short_desc, long_desc, status, thumbnail, floor_id } =
    data;
  const result = await pool.query(
    `UPDATE rooms SET name = $1, type_id = $2, short_desc = $3, long_desc = $4, status = $5, thumbnail = $6, floor_id = $7
     WHERE id = $8 RETURNING *`,
    [name, type_id, short_desc, long_desc, status, thumbnail, floor_id, id]
  );
  console.log(result);
  return result.rows[0];
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
  status = null,
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

  // Cho phép truyền vào trạng thái phòng cần kiểm tra (mặc định là 'available')
  const statusList = Array.isArray(status)
    ? status
    : status
    ? [status]
    : ["available"];

  // Debug: log các phòng bị loại do booking overlap
  try {
    const conflictQuery = `
      SELECT DISTINCT r.id as room_id, r.name as room_name, bi.check_in, bi.check_out, b.stay_status_id
      FROM rooms r
      JOIN booking_items bi ON bi.room_id = r.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE r.status = ANY($1)
        AND NOT (
          bi.check_out::date <= $2::date 
          OR bi.check_in::date >= $3::date
        )
        AND b.stay_status_id IN (1,2,6)
    `;
    const debugParams = [statusList, check_in, check_out];
    const res = await pool.query(conflictQuery, debugParams);
    if (res.rows.length) {
      console.log("[DEBUG] Các phòng bị loại do booking overlap:");
      res.rows.forEach((row) => {
        console.log(
          `Room #${row.room_id} (${row.room_name}) | Booking: ${row.check_in} - ${row.check_out} | Status: ${row.stay_status_id}`
        );
      });
    } else {
      console.log("[DEBUG] Không có phòng nào bị loại do booking overlap.");
    }
  } catch (err) {
    console.error("[DEBUG] Lỗi khi log conflictQuery:", err);
  }

  let query = `
    SELECT DISTINCT r.*, rt.name as type_name, rt.capacity
    FROM rooms r
    LEFT JOIN room_types rt ON r.type_id = rt.id
    WHERE r.status = ANY($1)
      AND rt.capacity >= $2
  `;

  const params = [statusList, totalGuests];
  console.log("📦 Initial params:", params);
  let paramIndex = 3;

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
  // Logic: Conflict xảy ra khi khoảng thời gian CHỒNG LẤN
  // Không conflict khi: check_out_cũ <= check_in_mới HOẶC check_in_cũ >= check_out_mới
  // => Conflict khi: NOT (check_out_cũ <= check_in_mới OR check_in_cũ >= check_out_mới)
  query += `
    AND NOT EXISTS (
      SELECT 1 FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.room_id = r.id
        AND b.stay_status_id IN (1, 2, 6) -- reserved, checked_in, pending
        AND NOT (
          bi.check_out::date <= $${paramIndex}::date 
          OR bi.check_in::date >= $${paramIndex + 1}::date
        )
    )
  `;
  params.push(check_in, check_out);

  // Sắp xếp theo tầng (floor_id) và tên phòng (name) tăng dần
  query += ` ORDER BY r.floor_id ASC, r.name ASC`;

  console.log("📝 Final query:", query);
  console.log("📦 Final params:", params);

  const result = await pool.query(query, params);
  console.log(`✅ Found ${result.rows.length} rooms`);

  return result.rows;
};
