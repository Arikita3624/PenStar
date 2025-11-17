import { instance } from "./api";
import type {
  Booking,
  BookingUpdatePayload,
  BookingShort,
  ChangeRoomRequest,
  ChangeRoomResponse,
} from "@/types/bookings";

export const createBooking = async (bookingData: Booking): Promise<Booking> => {
  const { data } = await instance.post("/bookings", bookingData);
  return data.data;
};

export const getBookings = async (): Promise<BookingShort[]> => {
  const { data } = await instance.get("/bookings");
  return data.data;
};

export const getMyBookings = async (): Promise<BookingShort[]> => {
  const { data } = await instance.get("/bookings/mine");
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

// Staff check-in: update guest info and set stay_status to checked_in
export const checkIn = async (
  id: number,
  payload: { id_card?: string; guest_name?: string; guest_phone?: string }
): Promise<Booking> => {
  const { data } = await instance.post(`/bookings/${id}/checkin`, payload);
  return data.data;
};

// Change room in booking
export const changeRoom = async (
  bookingId: number,
  payload: ChangeRoomRequest
): Promise<any> => {
  const { data } = await instance.patch(`/bookings/${bookingId}/change-room`, payload);
  // return full response so caller can see requires_payment and price_difference
  return data;
};

// Customer: create change request
export const requestChangeRoom = async (
  bookingId: number,
  payload: { booking_item_id: number; requested_room_id?: number; requested_room_type_id?: number; reason?: string }
) => {
  const { data } = await instance.post(`/bookings/${bookingId}/request-change`, payload);
  return data.data;
};

// Staff: list requests for a booking
export const getChangeRequests = async (bookingId: number) => {
  const { data } = await instance.get(`/bookings/${bookingId}/change-requests`);
  return data.data;
};

export const approveChangeRequest = async (reqId: number) => {
  const { data } = await instance.post(`/bookings/change-requests/${reqId}/approve`);
  return data.data;
};

export const rejectChangeRequest = async (reqId: number) => {
  const { data } = await instance.post(`/bookings/change-requests/${reqId}/reject`);
  return data.data;
};

// Customer: request a service during stay
export const requestService = async (payload: { booking_id: number; service_id: number; quantity: number; total_service_price: number }) => {
  const { data } = await instance.post(`/booking-services/request`, payload);
  return data.data;
};
