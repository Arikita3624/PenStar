import pool from "../db.js";

export const getStayStatuses = async () => {
  const res = await pool.query(
    "SELECT id, name FROM stay_status ORDER BY id ASC"
  );
  return res.rows;
};

export default { getStayStatuses };
