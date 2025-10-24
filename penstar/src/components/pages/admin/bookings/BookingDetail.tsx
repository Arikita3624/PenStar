import React from "react";
import { Card, Descriptions, Select, Button, message } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import { instance } from "@/services/api";

const { Option } = Select;

const BookingDetail: React.FC = () => {
  const { id } = useParams();
  const nav = useNavigate();
  type Booking = {
    id: number;
    customer_name?: string;
    total_price?: number;
    payment_status?: string;
    stay_status_id?: number;
  };

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [updating, setUpdating] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    instance
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data?.data))
      .catch(() => message.error("Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = (fields: Partial<Booking>) => {
    if (!id) return;
    setUpdating(true);
    instance
      .patch(`/bookings/${id}/status`, fields)
      .then((res) => {
        message.success("Updated");
        setBooking(res.data?.data);
      })
      .catch(() => message.error("Update failed"))
      .finally(() => setUpdating(false));
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>No booking</div>;

  return (
    <Card title={`Booking #${booking.id}`}>
      <Descriptions bordered>
        <Descriptions.Item label="Customer">
          {booking.customer_name}
        </Descriptions.Item>
        <Descriptions.Item label="Total">
          {booking.total_price}
        </Descriptions.Item>
        <Descriptions.Item label="Payment">
          {booking.payment_status}
        </Descriptions.Item>
        <Descriptions.Item label="Stay Status">
          {booking.stay_status_id}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 16 }}>
        <Select
          defaultValue={booking.payment_status}
          style={{ width: 200 }}
          onChange={(v) => handleUpdate({ payment_status: v })}
        >
          <Option value="pending">pending</Option>
          <Option value="paid">paid</Option>
          <Option value="failed">failed</Option>
        </Select>

        <Select
          defaultValue={booking.stay_status_id}
          style={{ width: 200, marginLeft: 8 }}
          onChange={(v) => handleUpdate({ stay_status_id: v })}
        >
          <Option value={0}>0</Option>
          <Option value={1}>1</Option>
          <Option value={2}>2</Option>
        </Select>

        <Button
          style={{ marginLeft: 8 }}
          loading={updating}
          onClick={() => nav(-1)}
        >
          Back
        </Button>
      </div>
    </Card>
  );
};

export default BookingDetail;
