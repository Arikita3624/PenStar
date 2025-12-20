import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "1",
  database: "hoteldb",
});
pool
  .query(
    "SELECT master_equipment_id, COUNT(*) as quantity FROM room_devices GROUP BY master_equipment_id"
  )
  .then((res) => {
    console.log(res.rows);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
