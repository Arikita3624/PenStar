import { instance } from "./api";

export const getFloors = async () => {
  try {
    const response = await instance.get("/floors");
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching floors:", error);
    throw error;
  }
};

export const getFloorById = async (id: string) => {
  try {
    const response = await instance.get(`/floors/${id}`);
    return Array.isArray(response.data.data) ? response.data.data : [];
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
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error creating floor:", error);
    throw error;
  }
};
