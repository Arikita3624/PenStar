/* eslint-disable @typescript-eslint/no-explicit-any */
import { instance } from "./api";

export const getMasterEquipments = async () => {
  const res = await instance.get("/master-equipments");
  return res.data.data;
};

export const createMasterEquipment = async (data: any) => {
  const res = await instance.post("/master-equipments", data);
  return res.data.data;
};

export const updateMasterEquipment = async (id: number, data: any) => {
  const res = await instance.put(`/master-equipments/${id}`, data);
  return res.data.data;
};

export const deleteMasterEquipment = async (id: number) => {
  const res = await instance.delete(`/master-equipments/${id}`);
  return res.data.data;
};

// Lấy thông tin thiết bị theo id
export const getMasterEquipmentById = async (id: number) => {
  const res = await instance.get(`/master-equipments/${id}`);
  return res.data.data;
};
