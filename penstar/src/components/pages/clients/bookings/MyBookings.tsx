import React from "react";
import { List, Card, Button, message, Tag, Modal } from "antd";
import { instance } from "@/services/api";
import { cancelBooking } from "@/services/bookingsApi";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const MyBookings: React.FC = () => {
  type Booking = {
    id: number;
    customer_name?: string;
    total_price?: number;
    payment_status?: string;
    stay_status_id?: number;
    stay_status_name?: string;
    is_refunded?: boolean;
  };
  const [data, setData] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const auth = useAuth() as unknown as { user?: { id?: number } };
  const nav = useNavigate();

  const fetchBookings = () => {
    if (!auth?.user) return;
    setLoading(true);
    instance
      .get("/bookings/mine")
      .then((res) => setData(res.data?.data ?? []))
      .catch(() => message.error("Load failed"))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const getStatusTag = (statusId?: number, statusName?: string) => {
    const id = statusId || 0;
    const name = statusName || "";

    // Database: 1=reserved, 2=checked_in, 3=checked_out, 4=canceled, 5=no_show, 6=pending
    if (id === 6) return <Tag color="gold">Chờ xác nhận</Tag>;
    if (id === 1) return <Tag color="blue">Đã xác nhận</Tag>;
    if (id === 2) return <Tag color="green">Đã Check-in</Tag>;
    if (id === 3) return <Tag color="cyan">Đã Check-out</Tag>;
    if (id === 4) return <Tag color="red">Đã hủy</Tag>;
    if (id === 5) return <Tag color="purple">No show</Tag>;

    return <Tag>{name || id || "-"}</Tag>;
  };

  const handleCancelBooking = async (bookingId: number) => {
    Modal.confirm({
      title: "Xác nhận hủy booking",
      content:
        "Bạn có chắc muốn hủy booking này? Nếu hủy trước 24h check-in, bạn sẽ được hoàn tiền 100%.",
      okText: "Hủy booking",
      cancelText: "Không",
      okType: "danger",
      onOk: async () => {
        setUpdating(true);
        try {
          await cancelBooking(bookingId);
          message.success("Đã hủy booking thành công!");
          fetchBookings(); // Reload list
        } catch (error) {
          console.error("Cancel booking error:", error);
          const err = error as { response?: { data?: { message?: string } } };
          message.error(err.response?.data?.message || "Lỗi hủy booking");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const formatPrice = (price?: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card title="Booking của tôi">
        <List
          loading={loading}
          dataSource={data}
          renderItem={(b: Booking) => {
            // Có thể hủy khi: pending (6) HOẶC reserved (1)
            // Backend sẽ kiểm tra thêm điều kiện 24h
            const canCancel = b.stay_status_id === 6 || b.stay_status_id === 1;

            return (
              <List.Item
                actions={[
                  <Button
                    type="primary"
                    onClick={() => nav(`/bookings/success/${b.id}`)}
                  >
                    Xem chi tiết
                  </Button>,
                  canCancel && (
                    <Button
                      danger
                      onClick={() => handleCancelBooking(b.id)}
                      loading={updating}
                    >
                      Hủy
                    </Button>
                  ),
                ].filter(Boolean)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">
                      Booking #{b.id}
                    </span>
                    {getStatusTag(b.stay_status_id, b.stay_status_name)}
                  </div>
                  <div className="text-gray-600">
                    Khách hàng: {b.customer_name}
                  </div>
                  <div className="text-gray-600">
                    Tổng tiền:{" "}
                    <span className="font-semibold text-blue-600">
                      {formatPrice(b.total_price)}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Thanh toán:{" "}
                    <Tag
                      color={
                        b.payment_status === "paid"
                          ? "green"
                          : b.payment_status === "pending"
                          ? "gold"
                          : b.payment_status === "failed"
                          ? "red"
                          : b.payment_status === "refunded"
                          ? "purple"
                          : b.payment_status === "cancelled"
                          ? "red"
                          : "default"
                      }
                    >
                      {b.payment_status?.toUpperCase()}
                    </Tag>
                    {b.is_refunded && (
                      <Tag color="purple" className="ml-1">
                        ✓ Đã hoàn tiền
                      </Tag>
                    )}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default MyBookings;
