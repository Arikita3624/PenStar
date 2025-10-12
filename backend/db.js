import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // ❌ Tắt SSL vì đang kết nối local
});

pool
  .connect()
  .then(() => console.log("✅ PostgreSQL connected successfully"))
  .catch((err) => console.error("❌ Connection error:", err));

export default pool;
