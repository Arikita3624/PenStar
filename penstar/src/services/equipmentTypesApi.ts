import { getMasterEquipments } from "./masterEquipmentsApi";

export const getEquipmentTypes = async (): Promise<string[]> => {
  const equipments = await getMasterEquipments();
  // Lấy danh sách loại thiết bị duy nhất
  const types = Array.from(new Set(equipments.map((eq: any) => eq.type)));
  return types;
};
