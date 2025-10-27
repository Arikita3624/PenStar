import { instance } from "./api";
import type { StayStatus } from "@/types/stayStatus";

export const getStayStatuses = async (): Promise<StayStatus[]> => {
  const res = await instance.get("/stay-status");
  return res.data?.data ?? [];
};

export default { getStayStatuses };
