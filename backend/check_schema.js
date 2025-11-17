import pool from "./db.js";

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `);

    console.log("=== BOOKINGS TABLE SCHEMA ===");
    result.rows.forEach((col) => {
      console.log(
        `${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSchema();
