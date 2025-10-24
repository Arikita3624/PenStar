import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Card, Button, Descriptions, List, Spin } from "antd";
import { instance } from "@/services/api";
import dayjs from "dayjs";

type Booking = {
  id?: number;
  customer_name?: string;
  total_price?: string | number;
  payment_status?: string;
  booking_method?: string;
  stay_status_id?: number;
  created_at?: string;
  is_refunded?: boolean;
  user_id?: number;
  items?: Array<Record<string, unknown>>;
  services?: Array<Record<string, unknown>>;
};

const fmtPrice = (v: string | number | undefined) => {
  if (v == null) return "0";
  const n = Number(v) || 0;
  return n.toLocaleString("vi-VN");
};

const BookingSuccess: React.FC = () => {
  const loc = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const initial =
    (loc.state as unknown as { booking?: Booking })?.booking ?? null;

  const [booking, setBooking] = React.useState<Booking | null>(initial);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!booking && id) {
      setLoading(true);
      instance
        .get(`/bookings/${id}`)
        .then((res) => setBooking(res.data?.data ?? null))
        .catch(() => setBooking(null))
        .finally(() => setLoading(false));
    }
  }, [id, booking]);

  if (loading)
    return (
      <div className="p-8">
        <Spin />
      </div>
    );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card title={`Booking #${booking?.id ?? id ?? "-"}`}>
        <div className="mb-4">Booking created successfully.</div>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Customer">
            {booking?.customer_name ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Total price">
            {fmtPrice(booking?.total_price)} VND
          </Descriptions.Item>
          <Descriptions.Item label="Payment status">
            {booking?.payment_status ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Method">
            {booking?.booking_method ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {booking?.created_at
              ? dayjs(booking.created_at as string).format("YYYY-MM-DD HH:mm")
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-4">
          <h3 className="mb-2">Rooms</h3>
          <List
            dataSource={booking?.items ?? []}
            renderItem={(it) => (
              <List.Item>
                <div>
                  <div className="font-semibold">
                    {String(it.name ?? it.room_id ?? "Room")}
                  </div>
                  <div>Check in: {String(it.check_in ?? "-")}</div>
                  <div>Check out: {String(it.check_out ?? "-")}</div>
                  <div>
                    Price: {fmtPrice(it.room_price as string | number)} VND
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        <div className="mt-4">
          <h3 className="mb-2">Services</h3>
          <List
            dataSource={booking?.services ?? []}
            renderItem={(s) => (
              <List.Item>
                <div>
                  <div className="font-semibold">
                    {String(s.name ?? s.service_id ?? "Service")}
                  </div>
                  <div>
                    Qty: {String(s.quantity ?? "-")} — Price:{" "}
                    {fmtPrice(s.total_service_price as string | number)} VND
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button type="primary" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BookingSuccess;
