export interface EquipmentStockLog {
  id: number;
  equipment_id: number;
  type: string;
  action?: string;
  quantity?: number;
  from_room_id?: number;
  to_room_id?: number;
  note?: string;
  created_at?: string;
  created_by?: number | string;
  old_data?: string;
  new_data?: string;
}
