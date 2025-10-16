import { instance } from "./api";

export const getServices = async () => {
  try {
    const response = await instance.get("/services");
    console.log("📦 Response from /services API:", response.data);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

export const getServiceById = async (id: number | string) => {
  try {
    const response = await instance.get(`/services/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    throw error;
  }
};
export const createService = async (serviceData: {
  name: string;
  description: string;
  price: number;
}) => {
  try {
    const response = await instance.post("/services", serviceData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

export const updateService = async (
  id: number | string,
  serviceData: { name: string; description: string; price: number }
) => {
  try {
    const response = await instance.put(`/services/${id}`, serviceData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error updating service ${id}:`, error);
    throw error;
  }
};

export const deleteService = async (id: number | string) => {
  try {
    const response = await instance.delete(`/services/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error(`Error deleting service ${id}:`, error);
    throw error;
  }
};

export const checkServiceNameExists = async (
  name: string,
  excludeId?: number | string
) => {
  try {
    const params: Record<string, string | number> = { name };
    if (excludeId) params.excludeId = excludeId;
    const response = await instance.get(`/services/check-name`, { params });
    return response.data?.exists ?? false;
  } catch (error) {
    console.error("Error checking service name exists:", error);
    throw error;
  }
};
