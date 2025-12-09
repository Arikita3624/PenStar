-- Fix base_children for all room types
-- Change from default 1 to 0, so children will incur extra fees

UPDATE room_types 
SET base_children = 0
WHERE base_children = 1;

-- Verify the change
SELECT id, name, base_adults, base_children, extra_adult_fee, extra_child_fee 
FROM room_types;
