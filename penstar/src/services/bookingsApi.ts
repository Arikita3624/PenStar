import { instance } from "./api";
import type {
  Booking,
  BookingUpdatePayload,
  BookingShort,
} from "@/types/bookings";

export const createBooking = async (bookingData: Booking): Promise<Booking> => {
  const { data } = await instance.post("/bookings", bookingData);
  return data.data;
};

export const getBookings = async (): Promise<BookingShort[]> => {
  const { data } = await instance.get("/bookings");
  return data.data;
};

export const getBookingById = async (id: number): Promise<Booking> => {
  const { data } = await instance.get(`/bookings/${id}`);
  return data.data;
};

export const updateBookingStatus = async (
  id: number,
  payload: BookingUpdatePayload
): Promise<Booking> => {
  const { data } = await instance.patch(`/bookings/${id}/status`, payload);
  return data.data;
};

// Client can cancel their own booking
export const cancelBooking = async (id: number): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/cancel`);
  return data.data;
};

// For updating booking status (check-in, check-out - client side)
export const updateMyBooking = async (
  id: number,
  payload: BookingUpdatePayload
): Promise<Booking> => {
  const { data } = await instance.patch(`/bookings/${id}/my-status`, payload);
  return data.data;
};

export const confirmCheckout = async (id: number): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/confirm-checkout`);
  return data.data;
};
