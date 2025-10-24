import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Button, List, Divider, message, Radio } from "antd";
import { instance } from "@/services/api";
import useAuth from "@/hooks/useAuth";

type RoomItem = {
  room_id: number;
  name?: string;
  check_in: string;
  check_out: string;
  room_price: number;
};

type ServiceItem = {
  service_id: number;
  name?: string;
  quantity: number;
  total_service_price: number;
};

type BookingState = {
  payload: unknown;
  rooms: RoomItem[];
  services?: ServiceItem[];
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
      const res = await instance.post("/bookings", payload);
      message.success("Booking created successfully");
      const booking = res.data?.data;
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

  const onPayVnpay = async () => {
    try {
      const payload = {
        ...(data!.payload as Record<string, unknown>),
      } as Record<string, unknown>;
      if (!payload.customer_name && auth?.user?.email)
        payload.customer_name = auth.user.email;
      const createRes = await instance.post("/bookings", payload);
      const booking = createRes.data?.data;
      if (!booking || !booking.id) throw new Error("Booking creation failed");
      const amount = booking.total_price ?? payload.total_price;
      const payRes = await instance.post("/bookings/create-payment", {
        bookingId: booking.id,
        amount,
        returnUrl: `${window.location.origin}/bookings/success/${booking.id}`,
      });
      const url = payRes.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        message.error("Payment creation failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Payment error");
    }
  };

  const [paymentMethod, setPaymentMethod] = React.useState<
    "pay_at_hotel" | "vnpay"
  >("pay_at_hotel");

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
            renderItem={(r: RoomItem) => (
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
            renderItem={(s: ServiceItem) => (
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
          <h3>Payment method</h3>
          <Radio.Group
            onChange={(e) => setPaymentMethod(e.target.value)}
            value={paymentMethod}
          >
            <Radio value="pay_at_hotel">Pay at hotel (cash on arrival)</Radio>
            <Radio value="vnpay" style={{ marginLeft: 16 }}>
              Pay with VNPAY
            </Radio>
          </Radio.Group>
          <Divider />
          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)}>Back</Button>
            <Button
              type="primary"
              onClick={() =>
                paymentMethod === "vnpay" ? onPayVnpay() : onConfirm()
              }
            >
              {paymentMethod === "vnpay" ? "Confirm & Pay" : "Confirm booking"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingConfirm;
