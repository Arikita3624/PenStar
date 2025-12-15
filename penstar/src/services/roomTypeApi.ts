import { instance } from "./api";
import type { RoomType } from "@/types/roomtypes";

export const getRoomTypes = async (): Promise<RoomType[]> => {
  try {
    const response = await instance.get("/roomtypes");
    console.log("📦 Response from /roomtypes API:", response.data);
    return response.data?.data ?? []; // Trả về array data hoặc array rỗng
  } catch (error) {
    console.error("Error fetching room types:", error);
    throw error;
  }
};

export const getRoomTypeById = async (
  id: number | string
): Promise<RoomType | null> => {
  try {
    const response = await instance.get(`/roomtypes/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching room type ${id}:`, error);
    throw error;
  }
};

export const createRoomType = async (roomTypeData: {
  name: string;
  description: string;
  thumbnail?: string;
  // amenities?: string[];
  capacity?: number;
  max_adults?: number;
  max_children?: number;
  base_occupancy?: number;
  price?: number;
}): Promise<RoomType | null> => {
  try {
    const response = await instance.post("/roomtypes", roomTypeData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating room type:", error);
    throw error;
  }
};

export const updateRoomType = async (
  id: number | string,
  roomTypeData: {
    name: string;
    description: string;
    // amenities?: string[];
    capacity?: number;
    max_adults?: number;
    max_children?: number;
    base_occupancy?: number;
    price?: number;
  }
) => {
  try {
    const response = await instance.put(`/roomtypes/${id}`, roomTypeData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error updating room type:", error);
    throw error;
  }
};

export const deleteRoomType = async (id: number | string) => {
  try {
    const response = await instance.delete(`/roomtypes/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error("Error deleting room type:", error);
    throw error;
  }
};

export const checkRoomTypeNameExists = async (
  name: string,
  excludeId?: number | string
) => {
  try {
    const params: Record<string, string | number> = { name };
    if (excludeId) params.excludeId = excludeId;
    const response = await instance.get(`/roomtypes/check-name`, { params });
    return response.data?.exists ?? false;
  } catch (error) {
    console.error("Error checking room type name exists:", error);
    throw error;
  }
};
