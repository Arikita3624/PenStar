export type PaymentMethod = "cash" | "card" | "transfer" | "momo" | "vnpay";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CreatePaymentParams = {
  bookingId: number;
  amount: number;
  orderInfo?: string;
  language?: string;
  returnUrl?: string;
};

export type CreatePaymentResponse = {
  paymentUrl: string | null;
  data?: {
    paymentUrl: string | null;
  };
};

export type PaymentResultParams = {
  vnp_ResponseCode?: string;
  vnp_TxnRef?: string;
  vnp_Amount?: string;
  vnp_OrderInfo?: string;
  vnp_TransactionStatus?: string;
};
