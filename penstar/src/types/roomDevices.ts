export interface RoomDevice {
  id: number;
  device_id?: number; // Thêm trường này để khớp với dữ liệu thực tế
  device_name: string;
  device_type: string;
  status?: string;
  room_id: number;
  note?: string;
  images?: string[];
  quantity: number;
}
