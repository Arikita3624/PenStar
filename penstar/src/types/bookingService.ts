export interface BookingService {
  id?: number;
  booking_id: number;
  booking_item_id?: number;
  service_id: number;
  quantity: number;
  total_service_price: number;
  service_name?: string;
  service_description?: string;
  service_unit_price?: number;
  room_name?: string;
  note?: string;
}
