/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = "http://localhost:5000/api/locations";

export async function getLocations() {
  const res = await axios.get(API_URL);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get locations");
  }
}

export async function getLocationById(id: string | number) {
  const res = await axios.get(`${API_URL}/${id}`);
  if (res.status === 200) {
    return res.data;
  } else {
    throw new Error("Failed to get location");
  }
}

export async function addLocation(data: any) {
  const res = await axios.post(API_URL, data);
  if (res.status === 200 || res.status === 201) {
    return res.data;
  } else {
    throw new Error("Failed to add location");
  }
}

export async function updateLocation(id: string | number, data: any) {
  const res = await axios.put(`${API_URL}/${id}`, data);
  if (res.status === 200 || res.status === 201) {
    return res.data;
  } else {
    throw new Error("Failed to update location");
  }
}
