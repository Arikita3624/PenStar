import { instance } from "./api";

export const getFloors = async () => {
  try {
    const response = await instance.get("/floors");
    console.log("📦 Response from /floors API:", response.data);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching floors:", error);
    throw error;
  }
};

export const getFloorById = async (id: string) => {
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
}) => {
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
) => {
  try {
    const response = await instance.put(`/floors/${id}`, floorData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error updating floor ${id}:`, error);
    throw error;
  }
};

export const deleteFloor = async (id: number | string) => {
  try {
    const response = await instance.delete(`/floors/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error(`Error deleting floor ${id}:`, error);
    throw error;
  }
};
