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

export interface BookingRoom {
  id: number;
  name: string;
  type_name: string;
  price: number;
  num_adults: number;
  num_children: number;
  num_babies?: number;
  extra_fees?: number; // Tổng phụ phí
  base_price?: number; // Giá gốc (trước khi cộng phụ phí)
  extra_adult_fees?: number; // Phụ phí người lớn
  extra_child_fees?: number; // Phụ phí trẻ em
  extra_adults_count?: number; // Số người lớn thêm
  extra_children_count?: number; // Số trẻ em thêm
}

export interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  rooms: BookingRoom[];
  promoCode?: string;
  onCheckout: () => void;
  onRemoveRoom?: (index: number) => void;
  loading: boolean;
}

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
  discount_amount?: number;
  original_total?: number;
  payment_status: string;
  payment_method?: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean;
  change_count?: number;
  promo_code?: string;
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
