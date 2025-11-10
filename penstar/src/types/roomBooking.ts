import type { Room } from "./room";
import type { RoomType } from "./roomtypes";

// Types for room booking configuration
export interface RoomBookingConfig {
  room_id: number;
  num_adults: number;
  num_children: number;
}

// Props for RoomTypeCard component
export interface RoomTypeCardProps {
  roomType: RoomType | undefined;
  roomsInType: Room[];
  numRooms: number;
  selectedRoomIds: number[];
  roomsConfig: RoomBookingConfig[];
  onSelectRoomType: (rooms: Room[]) => void;
  onRoomSelect: (room: Room) => void;
  onGuestChange: (
    roomId: number,
    field: "num_adults" | "num_children",
    value: number | null
  ) => void;
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
