/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = "http://localhost:5000/api/rooms";

export async function getRooms() {
  const res = await axios.get(API_URL);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get rooms");
  }
}

export async function getRoomById(id: string | number) {
  const res = await axios.get(`${API_URL}/${id}`);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get room");
  }
}

export async function addRoom(data: any) {
  const res = await axios.post(API_URL, data);
  if (res.status === 200 || res.status === 201) {
    return res.data;
  } else {
    throw new Error("Failed to add room");
  }
}

export async function updateRoom(id: string | number, data: any) {
  const res = await axios.put(`${API_URL}/${id}`, data);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to update room");
  }
}
