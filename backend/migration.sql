-- ============================================
-- PENSTAR HOTEL BOOKING SYSTEM - DATABASE MIGRATION
-- Date: December 6, 2025
-- Purpose: Add missing columns and optimize schema
-- ============================================

-- ============================================
-- 0. CREATE SERVICE_TYPES TABLE (Reference table)
-- ============================================
CREATE TABLE IF NOT EXISTS service_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if they don't exist
ALTER TABLE service_types
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Insert default service types
INSERT INTO service_types (code, name, description, display_order, is_active) VALUES
('buffet', 'Buffet', 'Dịch vụ ăn uống buffet', 1, TRUE),
('complimentary', 'Miễn phí', 'Dịch vụ miễn phí đi kèm', 2, TRUE),
('optional', 'Tùy chọn', 'Dịch vụ khách có thể đặt thêm', 3, TRUE),
('addon', 'Bổ sung', 'Dịch vụ bổ sung theo yêu cầu', 4, TRUE),
('transport', 'Vận chuyển', 'Dịch vụ đưa đón, vận chuyển', 5, TRUE),
('spa', 'Spa & Massage', 'Dịch vụ spa, massage, chăm sóc sức khỏe', 6, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 1. BOOKINGS TABLE - Add price breakdown columns
-- ============================================
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS total_room_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_service_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_total NUMERIC;

-- ============================================
-- 2. ROOM_TYPES TABLE - Add detailed information
-- ============================================
ALTER TABLE room_types
ADD COLUMN IF NOT EXISTS bed_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS view_direction VARCHAR(100),
ADD COLUMN IF NOT EXISTS safety_info TEXT,
ADD COLUMN IF NOT EXISTS amenities TEXT[],
ADD COLUMN IF NOT EXISTS paid_amenities TEXT[],
ADD COLUMN IF NOT EXISTS free_amenities TEXT[];

COMMENT ON COLUMN room_types.bed_type IS 'Loại giường: Single, Double, Twin, King, Queen';
COMMENT ON COLUMN room_types.view_direction IS 'Hướng nhìn: Sea View, City View, Garden View, Pool View';
COMMENT ON COLUMN room_types.safety_info IS 'Thông tin PCCC và an toàn';
COMMENT ON COLUMN room_types.amenities IS 'Danh sách tiện nghi tổng hợp';
COMMENT ON COLUMN room_types.paid_amenities IS 'Tiện nghi/đồ dùng mất phí (minibar, room service...)';
COMMENT ON COLUMN room_types.free_amenities IS 'Tiện nghi/đồ dùng miễn phí (WiFi, nước suối, đồ vệ sinh...)';

-- ============================================
-- 3. SERVICES TABLE - Add detailed information
-- ============================================

-- Drop thumbnail column if exists (might be named differently)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'services' AND column_name = 'thumbnail') THEN
        ALTER TABLE services DROP COLUMN thumbnail;
    END IF;
END $$;

-- Add new columns
ALTER TABLE services
ADD COLUMN IF NOT EXISTS service_type_code VARCHAR(20) DEFAULT 'optional',
ADD COLUMN IF NOT EXISTS is_included BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail TEXT,
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key to service_types
ALTER TABLE services
ADD CONSTRAINT fk_services_service_type 
FOREIGN KEY (service_type_code) REFERENCES service_types(code)
ON UPDATE CASCADE;

-- ============================================
-- 4. BOOKING_DEVICE_FEES TABLE - Check if exists
-- ============================================
CREATE TABLE IF NOT EXISTS booking_device_fees (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    damage_type VARCHAR(50),
    fee_amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE booking_device_fees IS 'Phí thiết bị hư hỏng/mất mát khi checkout';

-- ============================================
-- 5. DATA MIGRATION - Move discount info from notes to columns
-- ============================================
-- Parse discount info from notes field and update columns
DO $$
DECLARE
    booking_record RECORD;
    discount_info JSONB;
BEGIN
    FOR booking_record IN 
        SELECT id, notes 
        FROM bookings 
        WHERE notes LIKE '%[Discount:%'
    LOOP
        BEGIN
            -- Extract JSON from notes
            discount_info := substring(booking_record.notes FROM '\[Discount: ({[^}]+})\]')::JSONB;
            
            -- Update columns
            UPDATE bookings
            SET 
                discount_amount = (discount_info->>'discount_amount')::NUMERIC,
                original_total = (discount_info->>'original_total')::NUMERIC
            WHERE id = booking_record.id;
            
            RAISE NOTICE 'Updated booking % with discount info', booking_record.id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to parse discount for booking %: %', booking_record.id, SQLERRM;
        END;
    END LOOP;
END $$;

-- ============================================
-- 6. UPDATE EXISTING BOOKINGS - Calculate total_room_price and total_service_price
-- ============================================
UPDATE bookings b
SET 
    total_room_price = COALESCE((
        SELECT SUM(room_type_price) 
        FROM booking_items 
        WHERE booking_id = b.id
    ), 0),
    total_service_price = COALESCE((
        SELECT SUM(total_service_price) 
        FROM booking_services 
        WHERE booking_id = b.id
    ), 0)
WHERE total_room_price = 0 OR total_room_price IS NULL;

-- ============================================
-- 7. ADD SAMPLE DATA FOR ROOM_TYPES (Example)
-- ============================================
-- Update existing room types with default values
UPDATE room_types
SET 
    bed_type = CASE 
        WHEN name ILIKE '%deluxe%' THEN 'King Bed'
        WHEN name ILIKE '%suite%' THEN 'King Bed'
        WHEN name ILIKE '%twin%' THEN 'Twin Beds'
        WHEN name ILIKE '%double%' THEN 'Double Bed'
        ELSE 'Queen Bed'
    END,
    view_direction = 'City View',
    safety_info = 'Phòng được trang bị hệ thống báo cháy, bình chữa cháy, lối thoát hiểm theo tiêu chuẩn PCCC.',
    free_amenities = ARRAY[
        'WiFi miễn phí tốc độ cao',
        'Nước suối miễn phí (2 chai/ngày)',
        'Bàn chải đánh răng, kem đánh răng',
        'Dầu gội, sữa tắm',
        'Khăn tắm, khăn mặt',
        'Dép đi trong phòng'
    ],
    paid_amenities = ARRAY[
        'Minibar (đồ uống có gas)',
        'Room service (24/7)',
        'Dịch vụ giặt là',
        'Đồ ăn nhẹ (snacks)'
    ]
WHERE bed_type IS NULL;

-- ============================================
-- 8. ADD SAMPLE DATA FOR SERVICES (Example)
-- ============================================
-- Update existing services with types
UPDATE services
SET 
    service_type_code = CASE 
        WHEN name ILIKE '%breakfast%' OR name ILIKE '%buffet%' OR name ILIKE '%bữa sáng%' THEN 'buffet'
        WHEN name ILIKE '%spa%' OR name ILIKE '%massage%' THEN 'spa'
        WHEN name ILIKE '%airport%' OR name ILIKE '%transfer%' OR name ILIKE '%đưa đón%' THEN 'transport'
        WHEN name ILIKE '%laundry%' OR name ILIKE '%giặt%' THEN 'optional'
        WHEN name ILIKE '%complimentary%' OR name ILIKE '%miễn phí%' THEN 'complimentary'
        ELSE 'optional'
    END,
    is_included = CASE 
        WHEN name ILIKE '%complimentary%' OR name ILIKE '%miễn phí%' THEN TRUE
        ELSE FALSE
    END,
    note = CASE 
        WHEN service_type_code = 'buffet' THEN 'Buffet sáng phục vụ từ 6:00 - 10:00'
        WHEN service_type_code = 'spa' THEN 'Đặt lịch trước ít nhất 2 giờ'
        WHEN service_type_code = 'transport' THEN 'Thông báo trước ít nhất 24 giờ'
        WHEN service_type_code = 'optional' THEN 'Vui lòng đặt trước để được phục vụ tốt nhất'
        ELSE NULL
    END
WHERE service_type_code IS NULL OR service_type_code = 'optional';
-- ============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_total_room_price ON bookings(total_room_price);
CREATE INDEX IF NOT EXISTS idx_bookings_total_service_price ON bookings(total_service_price);
CREATE INDEX IF NOT EXISTS idx_bookings_discount_amount ON bookings(discount_amount);
CREATE INDEX IF NOT EXISTS idx_room_types_bed_type ON room_types(bed_type);
CREATE INDEX IF NOT EXISTS idx_services_service_type_code ON services(service_type_code);
CREATE INDEX IF NOT EXISTS idx_booking_device_fees_booking_id ON booking_device_fees(booking_id);
CREATE INDEX IF NOT EXISTS idx_services_is_included ON services(is_included);

-- ============================================
-- 10. VALIDATION QUERIES
-- ============================================
-- Check bookings with price breakdown
SELECT 
    id,
    customer_name,
    total_price,
    total_room_price,
    total_service_price,
    discount_amount,
    original_total,
    (total_room_price + total_service_price - COALESCE(discount_amount, 0)) as calculated_total
FROM bookings
WHERE total_price IS NOT NULL
ORDER BY id DESC
LIMIT 10;

-- Check room types with new fields
SELECT 
    id,
    name,
    price,
    bed_type,
    view_direction,
    array_length(free_amenities, 1) as free_count,
    array_length(paid_amenities, 1) as paid_count
FROM room_types
ORDER BY id;
-- Check services with types
SELECT 
    s.id,
    s.name,
    s.price,
    s.service_type_code,
    st.name as service_type_name,
    s.is_included,
    CASE WHEN s.image_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_image,
    CASE WHEN s.thumbnail IS NOT NULL THEN 'Yes' ELSE 'No' END as has_thumbnail
FROM services s
LEFT JOIN service_types st ON s.service_type_code = st.code
ORDER BY s.service_type_code, s.id;

-- ============================================
-- MIGRATION COMPLETED
-- ============================================
SELECT 'Migration completed successfully!' as status;
