import { instance } from "./api";

export type Device = {
  id: number;
  name: string;
  type?: string;
  fee?: number;
  description?: string;
};

export const getDevices = async (): Promise<Device[]> => {
  const { data } = await instance.get("/devices");
  return data.data || [];
};

export const getDeviceById = async (id: number): Promise<Device> => {
  const { data } = await instance.get(`/devices/${id}`);
  return data.data;
};

export const createDevice = async (payload: {
  name: string;
  type?: string;
  fee?: number;
  description?: string;
}): Promise<Device> => {
  const { data } = await instance.post("/devices", payload);
  return data.data;
};

export const updateDevice = async (
  id: number,
  payload: {
    name?: string;
    type?: string;
    fee?: number;
    description?: string;
  }
): Promise<Device> => {
  const { data } = await instance.put(`/devices/${id}`, payload);
  return data.data;
};

export const deleteDevice = async (id: number): Promise<void> => {
  await instance.delete(`/devices/${id}`);
};

