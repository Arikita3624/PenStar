import type { Room } from "./room";
import type { RoomType } from "./roomtypes";

// Types for room booking configuration
export interface RoomBookingConfig {
  room_id: number;
  room_type_id: number;
  quantity: number; // Số lượng phòng (luôn là 1 nếu mỗi phòng là một object)
  num_adults: number;
  num_children: number;
  num_babies?: number; // Em bé (0-5 tuổi) - optional, tối đa 2, không tính vào giới hạn
  special_requests?: string;
  price: number;
  base_price?: number; // Giá gốc (trước khi cộng phụ phí)
  extra_fees?: number; // Tổng phụ phí
  extra_adult_fees?: number; // Phụ phí người lớn
  extra_child_fees?: number; // Phụ phí trẻ em
  extra_adults_count?: number; // Số người lớn thêm
  extra_children_count?: number; // Số trẻ em thêm
}

// Props for RoomTypeCard component
export interface RoomTypeCardProps {
  roomType: RoomType | undefined;
  roomsInType: Room[];
  numRooms: number;
  selectedRoomIds: number[];
  roomsConfig: RoomBookingConfig[];
  disabled?: boolean;
  // useCapacity = true -> use room_type.capacity instead of per-type max adults/children
  onSelectRoomType: (
    rooms: Room[],
    roomsConfig: RoomBookingConfig[],
    useCapacity?: boolean
  ) => void;
  onRoomSelect: (room: Room) => void;
}

// Props for RoomCard component
export interface RoomCardProps {
  room: Room;
  isSelected: boolean;
  config: RoomBookingConfig | undefined;
  selectedRoomIds: number[];
  numRooms: number;
  onRoomSelect: (room: Room) => void;
  onGuestChange: (
    roomId: number,
    field: "num_adults" | "num_children" | "num_babies",
    value: number | null
  ) => void;
}
