export interface RoomType {
  id: number;
  name: string;
  description: string;
  capacity?: number;
  max_adults?: number;
  max_children?: number;
  base_occupancy?: number;
  thumbnail?: string;
  images?: string[];
  amenities?: string[];
  created_at: string;
  updated_at: string;
  price?: number;
}
