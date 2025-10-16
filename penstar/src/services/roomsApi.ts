import { instance } from "./api";

export const getRooms = async () => {
  try {
    const response = await instance.get("/rooms");
    console.log("📦 Response from /rooms API:", response.data);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoomID = async (id: number | string) => {
  try {
    const response = await instance.get(`/rooms/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching room with ID ${id}:`, error);
    throw error;
  }
};

export const createRoom = async (roomData: Record<string, unknown>) => {
  try {
    const response = await instance.post("/rooms", roomData);
    console.log("Payload sent to createRoom:", roomData);
    // controller returns { success, message, data }
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const updateRoom = async (
  id: number | string,
  roomData: Record<string, unknown>
) => {
  try {
    const response = await instance.put(`/rooms/${id}`, roomData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error updating room with ID ${id}:`, error);
    throw error;
  }
};

export const deleteRoom = async (id: number | string) => {
  try {
    const response = await instance.delete(`/rooms/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error(`Error deleting room ${id}:`, error);
    throw error;
  }
};

export const checkRoomNameExists = async (
  name: string,
  type_id: number | string,
  excludeId?: number | string
) => {
  try {
    const params: Record<string, string | number> = { name, type_id };
    if (excludeId) params.excludeId = excludeId;
    const response = await instance.get(`/rooms/check-name`, { params });
    return response.data?.exists ?? false;
  } catch (error) {
    console.error("Error checking room name exists:", error);
    throw error;
  }
};
