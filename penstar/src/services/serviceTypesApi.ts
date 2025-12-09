import api from "./api";

export interface ServiceType {
  id: number;
  code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const getServiceTypes = async (): Promise<ServiceType[]> => {
  const response = await api.get("/service-types");
  return response.data.data;
};

export const getServiceTypeByCode = async (
  code: string
): Promise<ServiceType> => {
  const response = await api.get(`/service-types/${code}`);
  return response.data.data;
};

export const createServiceType = async (
  data: Partial<ServiceType>
): Promise<ServiceType> => {
  const response = await api.post("/service-types", data);
  return response.data.data;
};

export const updateServiceType = async (
  code: string,
  data: Partial<ServiceType>
): Promise<ServiceType> => {
  const response = await api.put(`/service-types/${code}`, data);
  return response.data.data;
};

export const deleteServiceType = async (code: string): Promise<void> => {
  await api.delete(`/service-types/${code}`);
};
