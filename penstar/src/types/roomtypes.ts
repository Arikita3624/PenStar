export interface Device {
  id: number;
  name: string;
  type?: string;
  fee: number;
  description?: string;
}

export interface RoomTypePolicy {
  cancellation?: string;
  payment?: string;
  checkin?: string;
  checkout?: string;
  extra_fees?: string;
  other_policies?: string[];
}

export interface RoomType {
  id: number;
  name: string;
  description: string;
  capacity?: number;
  max_adults?: number;
  max_children?: number;
  base_adults?: number;
  base_children?: number;
  extra_adult_fee?: number;
  extra_child_fee?: number;
  child_age_limit?: number;
  policies?: RoomTypePolicy;
  base_occupancy?: number;
  room_size?: number;
  thumbnail?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  price?: number;
  devices_id?: number[];
  devices?: Device[];
  bed_type?: string;
  view_direction?: string;
  safety_info?: string;
  amenities?: string[];
  free_amenities?: string[];
  paid_amenities?: string[];
}
