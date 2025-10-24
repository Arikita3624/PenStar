import React from "react";
import { Table, Button, message } from "antd";
import { instance } from "@/services/api";
import { useNavigate } from "react-router-dom";

type Booking = {
  id: number;
  customer_name: string;
  total_price: number;
  payment_status: string;
};

const BookingsList: React.FC = () => {
  const [data, setData] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(false);
  const nav = useNavigate();

  React.useEffect(() => {
    setLoading(true);
    instance
      .get("/bookings")
      .then((res) => setData(res.data?.data ?? []))
      .catch(() => message.error("Load failed"))
      .finally(() => setLoading(false));
  }, []);

  const cols = [
    { title: "ID", dataIndex: "id" },
    { title: "Customer", dataIndex: "customer_name" },
    { title: "Total", dataIndex: "total_price" },
    { title: "Payment", dataIndex: "payment_status" },
    {
      title: "Actions",
      render: (r: Booking) => (
        <Button onClick={() => nav(`/admin/bookings/${r.id}`)}>View</Button>
      ),
    },
  ];

  return (
    <Table dataSource={data} columns={cols} rowKey="id" loading={loading} />
  );
};

export default BookingsList;
