export type BookingItem = {
  id?: number;
  room_id: number;
  check_in: string;
  check_out: string;
  room_price: number;
  room_type_price?: number;
  num_adults?: number;
  num_children?: number;
  special_requests?: string;
};

export type BookingService = {
  service_id: number;
  booking_item_id?: number;
  quantity: number;
  total_service_price: number;
};

export type Booking = {
  id?: number;
  customer_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  total_price: number;
  damage_total?: number;
  payment_status: string;
  payment_method?: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean;
  change_count?: number;
  items: BookingItem[];
  services?: BookingService[];
  damages?: BookingDamage[];
  created_at?: string;
  stay_status_name?: string;
  promo_code?: string;
  discount_amount?: number;
  original_total?: number;
};

// For listing bookings
export type BookingShort = {
  id: number;
  customer_name: string;
  total_price: number;
  payment_status: string;
  stay_status_id: number;
  stay_status_name?: string;
  created_at?: string;
  is_refunded?: boolean;
};

// For booking detail page
export type BookingDetails = Booking & {
  check_in?: string;
  check_out?: string;
  total_room_price?: number;
  total_service_price?: number;
  total_amount?: number;
  status?: string;
  is_refunded?: boolean;
};

export type BookingDamage = {
  id?: number;
  booking_id?: number;
  booking_item_id?: number | null;
  device_id?: number | null;
  device_name: string;
  description?: string;
  amount?: number;
};

export type BookingUpdatePayload = {
  payment_status?: string;
  payment_method?: string;
  stay_status_id?: number;
  is_refunded?: boolean;
  notes?: string;
};

// For multi-room booking form
export type RoomBookingData = {
  room_id: number;
  num_adults: number;
  num_children: number;
  children_ages?: number[];
  special_requests?: string;
  room_type_id: number;
  price: number;
  room_type_price?: number;
};
