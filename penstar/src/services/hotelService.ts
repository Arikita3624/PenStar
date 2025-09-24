/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = "http://localhost:5000/api/hotels";

export async function getHotels() {
  const res = await axios.get(API_URL);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get hotels");
  }
}

export async function getHotelById(id: string | number) {
  const res = await axios.get(`${API_URL}/${id}`);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get hotel");
  }
}

export async function addHotel(data: any) {
  const res = await axios.post(API_URL, data);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to add hotel");
  }
}
