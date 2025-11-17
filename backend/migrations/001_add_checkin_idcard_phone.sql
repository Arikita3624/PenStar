-- Migration: add id_card, phone, checkin_at to bookings
-- Run this against your Postgres DB connected to the backend

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS id_card TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMP;

-- Optional: create an index on checkin_at for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_at ON bookings (checkin_at);

-- Note: apply this migration with psql or your migration tool.
