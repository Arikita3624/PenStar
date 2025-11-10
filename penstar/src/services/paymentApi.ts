import instance from "./api";
import type {
  CreatePaymentParams,
  CreatePaymentResponse,
} from "@/types/payment";

export const createPayment = async (
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> => {
  const { data } = await instance.get<CreatePaymentResponse>(
    "/payment/create_payment",
    { params }
  );
  return data;
};
