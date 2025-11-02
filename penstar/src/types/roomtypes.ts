export interface RoomType {
  id: number;
  name: string;
  description: string;
  max_adults?: number;
  max_children?: number;
  base_occupancy?: number;
  created_at: string;
  updated_at: string;
}
