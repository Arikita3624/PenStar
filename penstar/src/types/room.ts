export interface Room {
  id: number;
  name: string;
  type_id: number;
  status: string;
  thumbnail?: string;
  room_type_name?: string;
  room_type_price?: number;
}

// Type cho tìm kiếm phòng
export interface RoomSearchParams {
  check_in: string; // Format: YYYY-MM-DD
  check_out: string; // Format: YYYY-MM-DD
  num_rooms?: number; // Số phòng cần đặt
  promo_code?: string; // Mã khuyến mãi/voucher
  room_type_id?: number; // Filter theo loại phòng
  floor_id?: number; // Filter theo tầng
  num_adults?: number; // Sẽ chọn ở trang Results
  num_children?: number; // Sẽ chọn ở trang Results
}

export interface RoomSearchResponse {
  success: boolean;
  message: string;
  data: Room[];
  search_params: {
    check_in: string;
    check_out: string;
    room_type_id: number | null;
    floor_id: number | null;
    num_adults: number;
    num_children: number;
    total_guests: number;
  };
}
