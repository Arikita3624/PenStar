/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";
import type { RoomDevice } from "@/types/roomDevices";

export const getRoomDevices = async (params?: {
  room_type_id?: number;
  room_id?: number;
}): Promise<RoomDevice[]> => {
  const res = await instance.get("/room-devices", { params });
  if (Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export const createRoomDevice = (data: any) =>
  instance.post("/room-devices", data);

export const updateRoomDevice = (id: number, data: any) =>
  instance.put(`/room-devices/${id}`, data);

export const deleteRoomDevice = (id: number) =>
  instance.delete(`/room-devices/${id}`);

export const transferRoomDevice = (data: {
  equipment_id: string;
  quantity: number;
  from_room_id: number;
  to_room_id: number;
  note?: string;
  created_by?: string;
}) => instance.post("/room-devices/transfer", data);
