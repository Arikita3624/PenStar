import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Descriptions,
  List,
  Spin,
  Tag,
  Space,
  message,
  Modal,
} from "antd";
import { instance } from "@/services/api";
import { updateMyBooking, cancelBooking } from "@/services/bookingsApi";
import type { Booking } from "@/types/bookings";
import dayjs from "dayjs";

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
  const [updating, setUpdating] = React.useState(false);

  const fetchBooking = React.useCallback(() => {
    if (!id) return;
    setLoading(true);
    instance
      .get(`/bookings/${id}`)
      .then((res) => setBooking(res.data?.data ?? null))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id, fetchBooking]);

  const handleCheckIn = async () => {
    if (!booking?.id) return;
    const bookingId = booking.id;
    Modal.confirm({
      title: "Xác nhận Check-in",
      content:
        "Bạn có muốn check-in vào phòng không? Trạng thái phòng sẽ chuyển sang Occupied.",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateMyBooking(bookingId, { stay_status_id: 2 }); // 2 = checked_in
          message.success(
            "Check-in thành công! Phòng đã chuyển sang trạng thái Occupied"
          );
          fetchBooking();
        } catch {
          message.error("Lỗi check-in");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleCheckOut = async () => {
    if (!booking?.id) return;
    const bookingId = booking.id;
    Modal.confirm({
      title: "Xác nhận Check-out",
      content:
        "Bạn có muốn check-out không? Phòng sẽ chuyển sang trạng thái Cleaning.",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateMyBooking(bookingId, { stay_status_id: 3 }); // 3 = checked_out
          message.success(
            "Check-out thành công! Phòng sẽ chuyển sang trạng thái Cleaning"
          );
          fetchBooking();
        } catch {
          message.error("Lỗi check-out");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!booking?.id) return;
    const bookingId = booking.id;
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
          message.success(
            "Đã hủy booking thành công! Phòng đã trở về trạng thái Available"
          );
          fetchBooking();
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

  const getStatusDisplay = (statusId?: number, statusName?: string) => {
    const name = statusName || "";
    const id = statusId || 0;
    // 1=reserved, 2=checked_in, 3=checked_out, 4=cancelled, 5=no_show, 6=pending
    if (id === 6) return <Tag color="warning">Đang đợi xác nhận</Tag>;
    if (id === 1) return <Tag color="blue">Đã xác nhận</Tag>;
    if (id === 2) return <Tag color="green">Đã Check-in</Tag>;
    if (id === 3) return <Tag color="default">Đã Check-out</Tag>;
    if (id === 4) return <Tag color="red">Đã hủy</Tag>;
    if (id === 5) return <Tag color="magenta">No show</Tag>;
    return <Tag>{name || id || "-"}</Tag>;
  };

  if (loading)
    return (
      <div className="p-8">
        <Spin />
      </div>
    );

  const statusId = booking?.stay_status_id || 0;
  const paymentStatus = booking?.payment_status || "";

  // Chỉ cho check-in khi: reserved (1) VÀ payment = paid
  const canCheckIn = statusId === 1 && paymentStatus === "paid";
  // Chỉ cho check-out khi: checked_in (2)
  const canCheckOut = statusId === 2;
  // Có thể hủy khi: pending (6) HOẶC reserved (1)
  // Backend sẽ kiểm tra thêm điều kiện 24h
  const canCancel = statusId === 6 || statusId === 1;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card
        title={
          <Space>
            <span>Booking #{booking?.id ?? id ?? "-"}</span>
            {getStatusDisplay(
              booking?.stay_status_id,
              booking?.stay_status_name
            )}
          </Space>
        }
      >
        <div className="mb-4">
          {statusId === 6 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
              ⏳ Booking của bạn đang chờ admin xác nhận. Bạn có thể hủy booking
              nếu muốn.
            </div>
          )}
          {statusId === 1 && paymentStatus !== "paid" && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded mb-4">
              💳 Booking đã được xác nhận! Vui lòng thanh toán (COD) để có thể
              check-in. Bạn có thể hủy booking trước khi thanh toán.
              <br />
              <strong>
                Trạng thái thanh toán: {paymentStatus?.toUpperCase()}
              </strong>
            </div>
          )}
          {statusId === 1 && paymentStatus === "paid" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
              ✅ Booking đã được xác nhận và thanh toán! Bạn có thể check-in khi
              đến phòng.
            </div>
          )}
          {statusId === 2 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
              🏠 Bạn đã check-in. Chúc bạn có kỳ nghỉ vui vẻ!
            </div>
          )}
          {statusId === 3 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded mb-4">
              👋 Cảm ơn bạn đã checkout! Chờ admin xác nhận để hoàn tất.
            </div>
          )}
          {statusId === 4 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
              ❌ Booking đã bị hủy. Phòng đã trở về trạng thái Available.
              {booking?.is_refunded && (
                <>
                  <br />
                  <span className="text-purple-600 font-semibold">
                    💰 Tiền đã được hoàn lại
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Khách hàng">
            {booking?.customer_name ?? "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng tiền">
            {fmtPrice(booking?.total_price)} VND
          </Descriptions.Item>
          <Descriptions.Item label="Thanh toán">
            <Tag
              color={
                paymentStatus === "paid"
                  ? "green"
                  : paymentStatus === "pending"
                  ? "gold"
                  : paymentStatus === "failed"
                  ? "red"
                  : paymentStatus === "refunded"
                  ? "purple"
                  : paymentStatus === "cancelled"
                  ? "red"
                  : "default"
              }
            >
              {paymentStatus?.toUpperCase() || "-"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức thanh toán">
            {booking?.payment_method === "vnpay" && "💰 VNPAY"}
            {booking?.payment_method === "momo" && "📱 Ví MoMo"}
            {booking?.payment_method === "transfer" && "🏦 Chuyển khoản"}
            {booking?.payment_method === "cash" && "💵 Tiền mặt"}
            {booking?.payment_method === "card" && "💳 Thẻ"}
            {booking?.payment_method === "cod" &&
              "🏨 Thanh toán tại quầy (COD)"}
            {!booking?.payment_method && "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức đặt phòng">
            {booking?.booking_method === "online"
              ? "🌐 Online"
              : "🏨 Trực tiếp"}
          </Descriptions.Item>
          {booking?.is_refunded && (
            <Descriptions.Item label="Trạng thái hoàn tiền">
              <Tag color="purple">✓ Đã hoàn tiền</Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Thời gian đặt">
            {booking?.created_at
              ? dayjs(booking.created_at as string).format("DD/MM/YYYY HH:mm")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
        <div className="mt-4">
          <h3 className="mb-2 font-semibold">Phòng đã đặt</h3>
          <List
            dataSource={booking?.items ?? []}
            renderItem={(it) => (
              <List.Item>
                <div>
                  <div className="font-semibold">Phòng #{it.room_id}</div>
                  <div>Check in: {it.check_in}</div>
                  <div>Check out: {it.check_out}</div>
                  <div>Giá: {fmtPrice(it.room_price)} VND</div>
                </div>
              </List.Item>
            )}
          />
        </div>
        <div className="mt-4">
          <h3 className="mb-2 font-semibold">Dịch vụ</h3>
          <List
            dataSource={booking?.services ?? []}
            renderItem={(s) => (
              <List.Item>
                <div>
                  <div className="font-semibold">Dịch vụ #{s.service_id}</div>
                  <div>
                    Số lượng: {s.quantity} — Giá:{" "}
                    {fmtPrice(s.total_service_price)} VND
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>

        {/* Thông báo thanh toán tại khách sạn */}
        {booking?.id && paymentStatus === "pending" && (
          <Card title="💳 Thanh toán" style={{ marginTop: 24 }} bordered>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                Vui lòng thanh toán{" "}
                <strong>{fmtPrice(booking.total_price)}</strong> khi đến khách
                sạn
              </p>
              <Tag
                color="warning"
                style={{ fontSize: 14, padding: "8px 16px" }}
              >
                Trạng thái: Chờ thanh toán
              </Tag>
            </div>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button onClick={() => navigate("/my-bookings")}>
            Xem booking của tôi
          </Button>
          <Space>
            {canCheckIn && (
              <Button type="primary" onClick={handleCheckIn} loading={updating}>
                Check-in
              </Button>
            )}
            {!canCheckIn && statusId === 1 && paymentStatus !== "paid" && (
              <Button type="primary" disabled>
                Check-in (Chờ thanh toán)
              </Button>
            )}
            {canCheckOut && (
              <Button
                type="primary"
                danger
                onClick={handleCheckOut}
                loading={updating}
              >
                Check-out
              </Button>
            )}
            {canCancel && (
              <Button danger onClick={handleCancel} loading={updating}>
                Hủy booking
              </Button>
            )}
            <Button onClick={() => navigate("/")}>Về trang chủ</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default BookingSuccess;
