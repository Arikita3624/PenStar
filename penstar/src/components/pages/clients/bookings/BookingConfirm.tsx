/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, List, Divider, message } from "antd";
import { createBooking } from "@/services/bookingsApi";
import type { BookingItem, BookingService } from "@/types/bookings";
import useAuth from "@/hooks/useAuth";

type BookingState = {
  payload: unknown;
  rooms: (BookingItem & { name?: string })[];
  services?: (BookingService & { name?: string })[];
} | null;

const BookingConfirm: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const auth = useAuth() as unknown as { user?: { email?: string } };
  const data = (loc.state as unknown as BookingState) || null;

  React.useEffect(() => {
    if (!data) {
      navigate("/rooms");
    }
  }, [data, navigate]);

  const onConfirm = async () => {
    try {
      // ensure required customer_name is present (backend Joi requires it)
      const payload = {
        ...(data!.payload as Record<string, unknown>),
      } as Record<string, unknown>;
      if (!payload.customer_name && auth?.user?.email) {
        payload.customer_name = auth.user.email;
      }
      const res = await createBooking(payload as any);
      message.success("Booking created successfully");
      const booking = res;
      if (!booking || !booking.id) {
        message.error("Booking created but missing ID");
        return;
      }
      navigate(`/bookings/success/${booking.id}`, { state: { booking } });
    } catch (errorUnknown) {
      console.error(errorUnknown);
      const e = errorUnknown as unknown;
      // try to pluck common message paths
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (e as Error).message ||
        "Create failed";
      message.error(String(msg));
    }
  };

  if (!data) return null;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card title="Confirm booking">
        <div>
          <h3>Customer</h3>
          <div>{auth?.user?.email ?? "(your account)"}</div>
          <Divider />

          <h3>Rooms</h3>
          <List
            dataSource={data.rooms}
            renderItem={(r) => (
              <List.Item>
                <div className="w-full">
                  <div className="font-semibold">{r.name}</div>
                  <div>
                    Check in: {r.check_in} — Check out: {r.check_out}
                  </div>
                  <div>Price: {r.room_price}</div>
                </div>
              </List.Item>
            )}
          />

          <Divider />
          <h3>Services</h3>
          <List
            dataSource={data.services || []}
            renderItem={(s) => (
              <List.Item>
                <div className="w-full">
                  <div className="font-semibold">
                    {s.name || `Service ${s.service_id}`}
                  </div>
                  <div>
                    Qty: {s.quantity} — Price: {s.total_service_price}
                  </div>
                </div>
              </List.Item>
            )}
          />

          <Divider />
          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)}>Back</Button>
            <Button type="primary" onClick={onConfirm}>
              Confirm booking
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingConfirm;
