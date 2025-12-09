import pool from "./db.js";

async function checkSchema() {
  try {
    // Lấy danh sách tất cả các bảng
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log("=== ALL TABLES IN DATABASE ===");
    console.log(tables.rows.map((r) => r.table_name).join(", "));
    console.log("\n");

    // Kiểm tra schema chi tiết từng bảng quan trọng
    const importantTables = [
      "bookings",
      "booking_items",
      "booking_services",
      "room_types",
      "rooms",
      "services",
      "devices",
      "users",
      "roles",
      "floors",
      "stay_status",
      "booking_device_fees",
      "room_images",
      "room_type_images",
    ];

    for (const tableName of importantTables) {
      const result = await pool.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `,
        [tableName]
      );

      if (result.rows.length > 0) {
        console.log(`\n=== ${tableName.toUpperCase()} ===`);
        result.rows.forEach((col) => {
          const def = col.column_default
            ? ` [default: ${col.column_default}]`
            : "";
          console.log(
            `  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})${def}`
          );
        });
      }
    }

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSchema();
