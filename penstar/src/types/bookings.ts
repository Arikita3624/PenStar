export type BookingItem = {
  id?: number;
  room_id: number;
  check_in: string;
  check_out: string;
  room_price: number;
  room_type_price?: number;
  num_adults: number;
  num_children: number;
  num_babies?: number;
  special_requests?: string;
  // Các trường phụ phí và chi tiết phòng
  base_price?: number;
  extra_fees?: number;
  extra_adult_fees?: number;
  extra_child_fees?: number;
  extra_adults_count?: number;
  extra_children_count?: number;
  room_type_id?: number;
  room_type_name?: string;
};

export interface BookingRoom {
  id: number;
  name: string;
  type_name: string;
  price: number;
  num_adults: number;
  num_children: number;
  num_babies?: number;
  extra_fees?: number; // Tổng phụ phí
  base_price?: number;
  extra_adult_fees?: number; // Phụ phí người lớn
  extra_child_fees?: number; // Phụ phí trẻ em
  extra_adults_count?: number; // Số người lớn thêm
  extra_children_count?: number; // Số trẻ em thêm
}

// BookingSidebarProps removed: not used as a type anymore, replaced with inline props

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
  total_room_price?: number;
  total_service_price?: number;
  // ...existing code...
  payment_status: string;
  payment_method?: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean;
  change_count?: number;
  // ...existing code...
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
  // total_amount removed: not used in booking flow
  status?: string;
  is_refunded?: boolean;
  checked_in_by_email?: string;
  checked_out_by_email?: string;
};

export type BookingUpdatePayload = {
  payment_status?: string;
  payment_method?: string;
  stay_status_id?: number;
  is_refunded?: boolean;
  notes?: string;
};
