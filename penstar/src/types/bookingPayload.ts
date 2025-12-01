export type AutoAssignRoomConfig = {
  room_type_id: number;
  quantity: number;
  check_in: string;
  check_out: string;
  room_type_price: number;
  num_adults: number;
  num_children: number;
  services?: Array<{
    service_id: number;
    quantity: number;
    total_service_price: number;
  }>;
};
