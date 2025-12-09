-- Migration: Add missing fields to room_types table
-- Date: 2025-12-06

-- Add room_size and floor_material to room_types
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS room_size NUMERIC,
ADD COLUMN IF NOT EXISTS floor_material VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN room_types.room_size IS 'Room size in square meters (m²)';
COMMENT ON COLUMN room_types.floor_material IS 'Floor material type: carpet, wood, tile, marble, etc.';
