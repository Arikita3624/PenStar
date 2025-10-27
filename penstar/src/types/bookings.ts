export type BookingItem = {
  room_id: number;
  check_in: string;
  check_out: string;
  room_price: number;
};

export type BookingService = {
  service_id: number;
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
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean;
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
  stay_status_id?: number;
  is_refunded?: boolean;
};
