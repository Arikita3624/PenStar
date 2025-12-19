import { instance } from "./api";

export const importEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  note?: string;
}) => {
  return instance.post("/equipment-stock-logs/import", data);
};

// Alias for compatibility with EquipmentImport.tsx
export const importEquipmentStock = importEquipment;

export const exportEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  note?: string;
}) => {
  return instance.post("/equipment-stock-logs/export", data);
};

export const transferEquipment = async (data: {
  equipment_id: number;
  quantity: number;
  from_room_id: number;
  to_room_id: number;
  note?: string;
}) => {
  return instance.post("/equipment-stock-logs/transfer", data);
};

export const getAllStockLogs = async () => {
  const res = await instance.get("/equipment-stock-logs/logs/all");
  return res.data.data;
};
