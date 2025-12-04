import instance from "./api";

export interface DiscountCode {
  id?: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  valid_from: string;
  valid_until: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ValidateDiscountCodeResponse {
  discountCode: DiscountCode;
  discountAmount: number;
  finalAmount: number;
}

export const getDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await instance.get("/discount-codes");
  return response.data.data;
};

export const getDiscountCodeById = async (
  id: number
): Promise<DiscountCode> => {
  const response = await instance.get(`/discount-codes/${id}`);
  return response.data.data;
};

export const createDiscountCode = async (
  data: Omit<DiscountCode, "id" | "created_at" | "updated_at">
): Promise<DiscountCode> => {
  const response = await instance.post("/discount-codes", data);
  return response.data.data;
};

export const updateDiscountCode = async (
  id: number,
  data: Partial<DiscountCode>
): Promise<DiscountCode> => {
  const response = await instance.put(`/discount-codes/${id}`, data);
  return response.data.data;
};

export const deleteDiscountCode = async (id: number): Promise<void> => {
  await instance.delete(`/discount-codes/${id}`);
};

export const validateDiscountCode = async (
  code: string,
  orderAmount: number
): Promise<ValidateDiscountCodeResponse> => {
  const response = await instance.get("/discount-codes/validate", {
    params: { code, order_amount: orderAmount },
  });
  return response.data.data;
};

// Get active discount codes (public - for customers)
export const getActiveDiscountCodes = async (): Promise<DiscountCode[]> => {
  const response = await instance.get("/discount-codes/available");
  return response.data.data;
};

