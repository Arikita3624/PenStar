import { instance } from "./api";

export const getBookingIncidents = async (booking_id: number) => {
  const res = await instance.get("/booking-incidents", {
    params: { booking_id },
  });
  return res.data.data;
};

export const createBookingIncident = async (data: any) => {
  const res = await instance.post("/booking-incidents", data);
  return res.data.data;
};

export const deleteBookingIncident = async (id: number) => {
  const res = await instance.delete(`/booking-incidents/${id}`);
  return res.data.data;
};
