import { instance } from "./api";
import type { AxiosProgressEvent } from "axios";
import type { RoomImage } from "@/types/roomImage";

export const getRoomImages = async (): Promise<RoomImage[]> => {
  const response = await instance.get("/room-images");
  return response.data.data;
};

export const getRoomImageById = async (id: number): Promise<RoomImage> => {
  const response = await instance.get(`/room-images/${id}`);
  return response.data.data;
};

export const getImagesByRoom = async (roomId: number): Promise<RoomImage[]> => {
  const response = await instance.get(`/room-images/room/${roomId}`);
  return response.data.data;
};

export const createRoomImage = async (
  data: Omit<RoomImage, "id" | "created_at" | "updated_at">
): Promise<RoomImage> => {
  const response = await instance.post("/room-images", data);
  return response.data.data;
};

export const uploadRoomImage = async (
  roomId: number | string,
  file: File,
  is_thumbnail = false,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  const form = new FormData();
  form.append("file", file);
  form.append("is_thumbnail", String(is_thumbnail));
  const response = await instance.post(
    `/room-images/room/${roomId}/upload`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    }
  );
  return response.data.data;
};

export const updateRoomImage = async (
  id: number,
  data: Partial<Omit<RoomImage, "id" | "created_at" | "updated_at">>
): Promise<RoomImage> => {
  const response = await instance.put(`/room-images/${id}`, data);
  return response.data.data;
};

export const deleteRoomImage = async (id: number): Promise<{ id: number }> => {
  const response = await instance.delete(`/room-images/${id}`);
  return response.data.data;
};
