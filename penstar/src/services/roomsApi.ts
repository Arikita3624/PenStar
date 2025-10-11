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
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error(`Error fetching room with ID ${id}:`, error);
    throw error;
  }
};

export const createRoom = async (roomData: FormData) => {
  try {
    const response = await instance.post("/rooms", roomData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const updateRoom = async (id: number | string, roomData: FormData) => {
  try {
    const response = await instance.put(`/rooms/${id}`, roomData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error(`Error updating room with ID ${id}:`, error);
    throw error;
  }
};
