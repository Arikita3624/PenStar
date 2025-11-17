-- Migration: create booking_change_requests table
-- Run against Postgres used by the backend

CREATE TABLE IF NOT EXISTS booking_change_requests (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_item_id INTEGER NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  requested_room_id INTEGER NULL,
  requested_room_type_id INTEGER NULL,
  reason TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
  requested_by INTEGER NULL,
  processed_by INTEGER NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_booking_id ON booking_change_requests (booking_id);
