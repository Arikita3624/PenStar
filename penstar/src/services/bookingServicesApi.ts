import instance from "./api";
import type { BookingService } from "@/types/bookingService";

export const getBookingServices = async (): Promise<BookingService[]> => {
  const response = await instance.get("/booking-services");
  return response.data.data;
};

export const getServicesByBooking = async (
  booking_id: number
): Promise<BookingService[]> => {
  const response = await instance.get(
    `/booking-services/booking/${booking_id}`
  );
  return response.data.data;
};

export const getServicesByBookingItem = async (
  booking_item_id: number
): Promise<BookingService[]> => {
  const response = await instance.get(
    `/booking-services/booking-item/${booking_item_id}`
  );
  return response.data.data;
};

// Accepts note as part of data
export const createBookingService = async (
  data: Omit<
    BookingService,
    | "id"
    | "service_name"
    | "service_description"
    | "service_unit_price"
    | "room_name"
  > & { note?: string }
): Promise<BookingService> => {
  const response = await instance.post("/booking-services", data);
  return response.data.data;
};
