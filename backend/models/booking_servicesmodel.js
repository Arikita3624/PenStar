import pool from "../db.js";

export const getBookingServices = async () => {
  const res = await pool.query(
    "SELECT * FROM booking_services ORDER BY id DESC"
  );
  return res.rows;
};

export const getBookingServiceById = async (id) => {
  const res = await pool.query("SELECT * FROM booking_services WHERE id = $1", [
    id,
  ]);
  return res.rows[0];
};

export const createBookingService = async (data) => {
  const {
    booking_id,
    booking_item_id,
    service_id,
    quantity,
    total_service_price,
    created_by,
    note,
  } = data;
  const res = await pool.query(
    `INSERT INTO booking_services (booking_id, booking_item_id, service_id, quantity, total_service_price, created_by, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      booking_id,
      booking_item_id || null,
      service_id,
      quantity,
      total_service_price,
      created_by,
      note || null,
    ]
  );
  return res.rows[0];
};

// Get services by booking_item_id
export const getServicesByBookingItem = async (booking_item_id) => {
  const res = await pool.query(
    `SELECT bs.*, s.name as service_name, s.description as service_description, s.price as service_unit_price
     FROM booking_services bs
     LEFT JOIN services s ON bs.service_id = s.id
     WHERE bs.booking_item_id = $1
     ORDER BY bs.id DESC`,
    [booking_item_id]
  );
  return res.rows;
};

// Get services by booking_id
export const getServicesByBooking = async (booking_id) => {
  const res = await pool.query(
    `SELECT bs.*, s.name as service_name, s.description as service_description, s.price as service_unit_price,
            bi.id as booking_item_id, bi.room_id, r.name as room_name
     FROM booking_services bs
     LEFT JOIN services s ON bs.service_id = s.id
     LEFT JOIN booking_items bi ON bs.booking_item_id = bi.id
     LEFT JOIN rooms r ON bi.room_id = r.id
     WHERE bs.booking_id = $1
     ORDER BY bs.id DESC`,
    [booking_id]
  );
  return res.rows;
};
