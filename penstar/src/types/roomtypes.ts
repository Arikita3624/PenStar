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
  created_at: string;
  updated_at: string;
  price?: number;
  adult_surcharge?: number; // Phụ phí cho mỗi người lớn vượt quá max_adults
  child_surcharge?: number; // Phụ phí cho mỗi trẻ em
  devices_id?: number[];
  devices?: Array<{
    id: number;
    name: string;
    type?: string;
    fee?: number;
    description?: string;
  }>;
  amenities?: string[]; // Legacy field, keep for backward compatibility
}
