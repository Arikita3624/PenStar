export type BookingItem = {
  id?: number;
  room_id: number;
  check_in: string;
  check_out: string;
  room_price: number;
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
  payment_status: string;
  payment_method?: string; // cash, card, transfer, momo, vnpay, cod
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean;
  change_count?: number; // Số lần đã đổi phòng
  items: BookingItem[];
  services?: BookingService[];
  created_at?: string;
  stay_status_name?: string;
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

export type BookingUpdatePayload = {
  payment_status?: string;
  payment_method?: string;
  stay_status_id?: number;
  is_refunded?: boolean;
};

// For change room feature
export type ChangeRoomRequest = {
  booking_item_id: number;
  new_room_id: number;
  reason?: string; // Optional for customer, required for staff
};

export type ChangeRoomResponse = {
  success: boolean;
  old_room_id: number;
  new_room_id: number;
  price_difference: number;
  new_total_price: number;
  log?: {
    id: number;
    booking_id: number;
    booking_item_id: number;
    changed_by: number;
    old_room_id: number;
    new_room_id: number;
    price_difference: number;
    reason?: string;
    changed_at: string;
  };
};
