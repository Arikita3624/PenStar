import instance from "./api";

export interface BookingService {
  id?: number;
  booking_id: number;
  booking_item_id?: number;
  service_id: number;
  quantity: number;
  total_service_price: number;
  service_name?: string;
  service_description?: string;
  service_unit_price?: number;
  room_name?: string;
}

export const getBookingServices = async (): Promise<BookingService[]> => {
  const response = await instance.get("/booking-services");
  return response.data.data;
};

export const getServicesByBooking = async (
  booking_id: number
): Promise<BookingService[]> => {
  const response = await instance.get(`/booking-services/booking/${booking_id}`);
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

export const createBookingService = async (
  data: Omit<BookingService, "id" | "service_name" | "service_description" | "service_unit_price" | "room_name">
): Promise<BookingService> => {
  const response = await instance.post("/booking-services", data);
  return response.data.data;
};

export const deleteBookingService = async (id: number): Promise<void> => {
  await instance.delete(`/booking-services/${id}`);
};

