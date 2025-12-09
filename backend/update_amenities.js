import pool from "./db.js";

async function updateAmenities() {
  try {
    const amenities = [
      "WiFi miễn phí",
      "Điều hòa không khí",
      "TV màn hình phẳng",
      "Minibar",
      "Két an toàn",
      "Phòng tắm riêng",
      "Máy sấy tóc",
      "Đồ vệ sinh cá nhân miễn phí",
    ];

    await pool.query(
      "UPDATE room_types SET amenities = $1 WHERE id IN (10, 11, 12)",
      [amenities]
    );

    console.log("✅ Đã cập nhật amenities cho room types 10, 11, 12");

    const result = await pool.query(
      "SELECT id, name, amenities FROM room_types WHERE id IN (10, 11, 12)"
    );

    console.log("Kết quả:");
    result.rows.forEach((row) => {
      console.log(
        `- ${row.name} (ID ${row.id}): ${
          row.amenities ? row.amenities.length : 0
        } amenities`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
}

updateAmenities();
