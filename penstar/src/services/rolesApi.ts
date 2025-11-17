import { instance } from "./api";

export const getRoles = async () => {
  try {
    const response = await instance.get("/roles");
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const getRoleById = async (id: number | string) => {
  try {
    const response = await instance.get(`/roles/${id}`);
    return response.data?.data ?? null;
  } catch (error) {
    console.error(`Error fetching role ${id}:`, error);
    throw error;
  }
};

export const createRole = async (roleData: {
  name: string;
  description?: string;
}) => {
  try {
    const response = await instance.post("/roles", roleData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const updateRole = async (
  id: number | string,
  roleData: { name?: string; description?: string }
) => {
  try {
    const response = await instance.put(`/roles/${id}`, roleData);
    return response.data?.data ?? null;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

export const deleteRole = async (id: number | string) => {
  try {
    const response = await instance.delete(`/roles/${id}`);
    return response.data ?? null;
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};
