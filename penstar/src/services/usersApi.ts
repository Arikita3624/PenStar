import { instance } from "./api";
import type { RegisterPayload } from "@/types/users";

export const register = async (payload: RegisterPayload) => {
  const response = await instance.post(`/users/register`, payload);
  // backend returns { user }
  return response.data.user;
};

export const login = async (email: string, password: string) => {
  const response = await instance.post(`/users/login`, { email, password });
  // backend returns { token }
  return response.data.token;
};

export const getUsers = async () => {
  const response = await instance.get(`/users`);
  // backend returns { success, message, data } or raw depending on controller
  return response.data;
};

export const updateUser = async (
  id: number | string,
  payload: Record<string, unknown>
) => {
  const response = await instance.put(`/users/${id}`, payload);
  return response.data;
};
