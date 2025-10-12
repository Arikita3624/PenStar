import { instance } from "./api";

export const getRoomTypes = async () => {
  try {
    const response = await instance.get("/roomtypes");
    console.log("📦 Response from /roomtypes API:", response.data);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching room types:", error);
    throw error;
  }
};

export const createRoomType = async (roomTypeData: {
  name: string;
  description: string;
}) => {
  try {
    const response = await instance.post("/roomtypes", roomTypeData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating room type:", error);
    throw error;
  }
};
