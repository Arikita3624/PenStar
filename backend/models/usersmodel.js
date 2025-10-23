import pool from "../db.js";

export const getUsers = async () => {
  const res = await pool.query(
    `SELECT users.*, roles.name as role_name FROM users LEFT JOIN roles ON users.role_id = roles.id`
  );
  return res.rows;
};

export const getUserById = async (id) => {
  const res = await pool.query(
    `SELECT users.*, roles.name as role_name FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE users.id = $1`,
    [id]
  );
  return res.rows[0];
};

export const getUserByEmail = async (email) => {
  const res = await pool.query(
    `SELECT users.*, roles.name as role_name FROM users LEFT JOIN roles ON users.role_id = roles.id WHERE users.email = $1`,
    [email]
  );
  return res.rows[0];
};

export const createUser = async (data) => {
  let { full_name, email, password, phone, role_id } = data;
  try {
    // if role_id not provided, resolve role named 'customer'
    if (role_id === undefined || role_id === null) {
      const r = await pool.query(
        "SELECT id FROM roles WHERE LOWER(name) = 'customer' LIMIT 1"
      );
      if (r.rowCount) role_id = r.rows[0].id;
    }
  } catch (err) {
    // ignore and allow null role_id; DB may have constraint later
    console.error("failed resolving default role customer", err);
  }

  const res = await pool.query(
    `INSERT INTO users (full_name, email, password, phone, role_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
    [full_name, email, password, phone, role_id]
  );
  return res.rows[0];
};

export const updateUser = async (id, data) => {
  const { full_name, email, password, phone, role_id, status } = data;
  const res = await pool.query(
    `UPDATE users SET full_name = $1, email = $2, password = $3, phone = $4, role_id = $5, status = $6, updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [full_name, email, password, phone, role_id, status, id]
  );
  return res.rows[0];
};

export const deleteUser = async (id) => {
  const res = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [
    id,
  ]);
  return res.rows[0];
};

export const existsUserByEmail = async (email, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 AND id <> $2 LIMIT 1",
      [email, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query("SELECT 1 FROM users WHERE email = $1 LIMIT 1", [
    email,
  ]);
  return res.rowCount > 0;
};
