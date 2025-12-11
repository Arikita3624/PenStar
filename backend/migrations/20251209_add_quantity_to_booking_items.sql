-- Thêm trường quantity vào bảng booking_items
ALTER TABLE booking_items ADD COLUMN quantity INTEGER DEFAULT 1;

-- Nếu muốn tổng hợp quantity cho từng loại phòng trong bảng bookings (không khuyến nghị, chỉ dùng nếu cần tổng số phòng cho booking)
-- ALTER TABLE bookings ADD COLUMN total_quantity INTEGER DEFAULT 1;