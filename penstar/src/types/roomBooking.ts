import type { Room } from "./room";
import type { RoomType } from "./roomtypes";

// Types for room booking configuration
export interface RoomBookingConfig {
  room_id: number;
  num_adults: number;
  num_children: number;
  special_requests?: string;
  service_ids?: number[];
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
    field: "num_adults" | "num_children",
    value: number | null
  ) => void;
}
