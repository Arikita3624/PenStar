import { instance } from "./api";
import type { Floors } from "@/types/floors";

export const getFloors = async (): Promise<Floors[]> => {
  try {
    const response = await instance.get("/floors");
    console.log("📦 Response from /floors API:", response.data);
    return response.data?.data ?? []; // Trả về array data hoặc array rỗng
  } catch (error) {
    console.error("Error fetching floors:", error);
    throw error;
  }
};

export const getFloorById = async (id: string): Promise<Floors | null> => {
  try {
    const response = await instance.get(`/floors/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error fetching floor by ID:", error);
    throw error;
  }
};

export const createFloor = async (floorData: {
  name: string;
  description: string;
}): Promise<Floors | null> => {
  try {
    const response = await instance.post("/floors", floorData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating floor:", error);
    throw error;
  }
};

export const updateFloor = async (
  id: number | string,
  floorData: { name: string; description: string }
): Promise<Floors | null> => {
  try {
    const response = await instance.put(`/floors/${id}`, floorData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error updating floor ${id}:`, error);
    throw error;
  }
};

export const deleteFloor = async (id: number | string): Promise<null> => {
  try {
    const response = await instance.delete(`/floors/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error(`Error deleting floor ${id}:`, error);
    throw error;
  }
};

export const checkFloorNameExists = async (
  name: string,
  excludeId?: number | string
) => {
  try {
    const params: Record<string, string | number> = { name };
    if (excludeId) params.excludeId = excludeId;
    const response = await instance.get(`/floors/check-name`, { params });
    return response.data?.exists ?? false;
  } catch (error) {
    console.error("Error checking floor name exists:", error);
    throw error;
  }
};
