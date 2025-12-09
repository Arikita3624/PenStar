import pool from "./db.js";

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'room_types'
      ORDER BY ordinal_position
    `);

    console.log("=== ROOM_TYPES COLUMNS ===");
    result.rows.forEach((col) => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

    // Check if area column exists
    const hasArea = result.rows.some((col) => col.column_name === "area");

    if (!hasArea) {
      console.log("\n⚠️ Column 'area' does NOT exist. Adding it now...");
      await pool.query(`
        ALTER TABLE room_types ADD COLUMN area INTEGER DEFAULT 30
      `);
      console.log("✅ Column 'area' added successfully!");
    } else {
      console.log("\n✅ Column 'area' already exists!");
    }

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkColumns();
