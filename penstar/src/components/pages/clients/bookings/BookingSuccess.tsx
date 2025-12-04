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
import { cancelBooking, getBookingById } from "@/services/bookingsApi";
import type { Booking, BookingService } from "@/types/bookings";
import { getServiceById } from "@/services/servicesApi";
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
  const [loading, setLoading] = React.useState(!initial); // Không loading nếu đã có initial data
  const [updating, setUpdating] = React.useState(false);
  const [services, setServices] = React.useState<
    Record<number, { name: string; price: number }>
  >({});

  const fetchBooking = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBookingById(Number(id));
      setBooking(data);

      // Fetch service details - lazy load, không chặn UI
      if (Array.isArray(data.services) && data.services.length > 0) {
        const serviceIds = Array.from(
          new Set(
            data.services
              .map((s: { service_id?: number }) => s.service_id)
              .filter((id): id is number => id != null)
          )
        );

        // Fetch services song song nhưng không chặn rendering
        Promise.all(serviceIds.map((sid: number) => getServiceById(sid)))
          .then((serviceResults) => {
            const serviceMap: Record<number, { name: string; price: number }> =
              {};
            serviceResults.forEach((s) => {
              if (s && s.id)
                serviceMap[s.id] = { name: s.name, price: s.price };
            });
            setServices(serviceMap);
          })
          .catch((err) => {
            console.error("Error fetching services:", err);
          });
      }
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;

    // Nếu đã có initial booking từ state, hiển thị ngay
    if (initial && initial.id && String(initial.id) === id) {
      setBooking(initial);
      setLoading(false);

      // Fetch lại ở background để đảm bảo data mới nhất (đặc biệt là payment_status sau khi thanh toán)
      // Nhưng không chặn UI - user thấy ngay thông tin
      setTimeout(() => {
        fetchBooking();
      }, 100);
    } else {
      // Không có initial data, fetch ngay
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Chỉ depend vào id để tránh loop

  // Đã chuyển logic check-in sang phía admin. Người dùng không thể tự check-in.

  // chuyển logic check-out sang admin. Người dùng không thể tự check-out.

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" tip="Đang tải thông tin booking..." />
        </div>
      </div>
    );

  const statusId = booking?.stay_status_id || 0;
  const paymentStatus = booking?.payment_status || "";

  // Có thể hủy khi: pending (6) HOẶC reserved (1)
  // Backend sẽ kiểm tra thêm điều kiện 24h
  const canCancel = statusId === 6 || statusId === 1;

  // Tính tổng số người lớn và trẻ em từ tất cả các phòng
  const totalAdults = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_adults || 0), 0)
    : 0;
  const totalChildren = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_children || 0), 0)
    : 0;

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Compact */}
        <div
          className="relative py-3 mb-3 rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
          }}
        >
          <div className="text-center relative z-10">
            <h1
              className="text-xl font-bold text-white mb-1"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
            >
              Chi tiết đặt phòng
            </h1>
            <div className="flex justify-center items-center gap-2">
              <span
                className="text-white text-sm"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
              >
                Booking #{booking?.id ?? id ?? "-"}
              </span>
              {getStatusDisplay(
                booking?.stay_status_id,
                booking?.stay_status_name
              )}
            </div>
          </div>
        </div>

        <Card
          className="rounded-xl overflow-hidden border-0"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="space-y-4">
            {/* Status Messages */}
            {statusId === 6 && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.1) 100%)",
                  border: "1px solid rgba(251,191,36,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">⏳</span>
                  <div>
                    <div className="font-bold text-base text-yellow-700 mb-0.5">
                      Đang chờ xác nhận
                    </div>
                    <div className="text-gray-700 text-sm">
                      Booking của bạn đang chờ admin xác nhận. Bạn có thể hủy
                      booking nếu muốn.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {statusId === 1 && paymentStatus !== "paid" && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.1) 100%)",
                  border: "1px solid rgba(249,115,22,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">💳</span>
                  <div>
                    <div className="font-bold text-base text-orange-700 mb-0.5">
                      Chờ thanh toán
                    </div>
                    <div className="text-gray-700 text-sm">
                      Booking đã được xác nhận! Vui lòng thanh toán để có thể
                      check-in. Bạn có thể hủy booking trước khi thanh toán.
                      <br />
                      <strong className="text-orange-800">
                        Trạng thái thanh toán: {paymentStatus?.toUpperCase()}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {statusId === 1 && paymentStatus === "paid" && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%)",
                  border: "1px solid rgba(59,130,246,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <div className="font-bold text-base text-blue-700 mb-0.5">
                      Đã xác nhận và thanh toán
                    </div>
                    <div className="text-gray-700 text-sm">
                      Booking đã được xác nhận và thanh toán! Bạn có thể
                      check-in khi đến phòng.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {statusId === 2 && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(22,163,74,0.1) 100%)",
                  border: "1px solid rgba(34,197,94,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">🏠</span>
                  <div>
                    <div className="font-bold text-base text-green-700 mb-0.5">
                      Đã check-in
                    </div>
                    <div className="text-gray-700 text-sm">
                      Bạn đã check-in. Chúc bạn có kỳ nghỉ vui vẻ!
                    </div>
                  </div>
                </div>
              </div>
            )}
            {statusId === 3 && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(156,163,175,0.1) 0%, rgba(107,114,128,0.1) 100%)",
                  border: "1px solid rgba(156,163,175,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">👋</span>
                  <div>
                    <div className="font-bold text-base text-gray-700 mb-0.5">
                      Đã check-out
                    </div>
                  </div>
                </div>
              </div>
            )}
            {statusId === 4 && (
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.1) 100%)",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl">❌</span>
                  <div>
                    <div className="font-bold text-base text-red-700 mb-0.5">
                      Booking đã hủy
                    </div>
                    <div className="text-gray-700 text-sm">
                      Booking đã bị hủy. Phòng đã trở về trạng thái Available.
                      {booking?.is_refunded && (
                        <>
                          <br />
                          <span className="text-purple-600 font-semibold text-sm">
                            💰 Tiền đã được hoàn lại
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details */}
            <Descriptions bordered column={1} size="small" className="mt-4">
              <Descriptions.Item label="Khách hàng">
                {booking?.customer_name ?? "-"}
              </Descriptions.Item>
              {booking?.original_total && booking?.discount_amount ? (
                <>
                  <Descriptions.Item label="Tổng tiền gốc">
                    <span style={{ textDecoration: "line-through", color: "#999" }}>
                      {fmtPrice(booking.original_total)} VND
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã giảm giá">
                    <Tag color="green">{booking.promo_code}</Tag>
                    <span style={{ marginLeft: 8, color: "#52c41a", fontWeight: "bold" }}>
                      -{fmtPrice(booking.discount_amount)} VND
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tổng tiền sau giảm">
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "#ff4d4f" }}>
                      {fmtPrice(booking?.total_price)} VND
                    </span>
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label="Tổng tiền">
                  {fmtPrice(booking?.total_price)} VND
                </Descriptions.Item>
              )}
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
                {booking?.payment_method === "cash" && "💵 Tiền mặt"}
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
                  ? dayjs(booking.created_at as string).format(
                      "DD/MM/YYYY HH:mm"
                    )
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
            <div className="mt-3">
              <h3 className="mb-1.5 font-semibold text-sm">
                Thông tin đặt phòng
              </h3>
              <Card size="small" className="bg-blue-50 border-blue-200">
                <Space direction="vertical" className="w-full">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số phòng:</span>
                    <span className="font-semibold">
                      {booking?.items?.length || 0} phòng
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số người lớn:</span>
                    <span className="font-semibold">{totalAdults}</span>
                  </div>
                  {totalChildren > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số trẻ em:</span>
                      <span className="font-semibold">{totalChildren} trẻ</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-xs text-blue-800 flex items-start gap-2">
                      <span>📧</span>
                      <span>
                        <strong>Thông tin phòng cụ thể</strong> (số phòng, tầng)
                        đã được gửi qua email của bạn
                      </span>
                    </p>
                  </div>
                </Space>
              </Card>
            </div>
            {Array.isArray(booking?.services) &&
              booking.services.length > 0 && (
                <div className="mt-3">
                  <h3 className="mb-1.5 font-semibold text-sm">Dịch vụ</h3>
                  <List
                    size="small"
                    dataSource={booking.services}
                    renderItem={(s: BookingService) => {
                      const serviceInfo = services[s.service_id];
                      return (
                        <List.Item>
                          <div className="text-sm">
                            <div className="font-semibold">
                              {serviceInfo?.name || `Dịch vụ #${s.service_id}`}
                            </div>
                            <div>
                              Số lượng: {s.quantity} — Giá:{" "}
                              {fmtPrice(s.total_service_price)} VND
                            </div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              )}

            {/* Thông báo thanh toán và nút thanh toán lại */}
            {booking?.id && (paymentStatus === "pending" || paymentStatus === "failed") && (
              <Card
                title="💳 Thanh toán"
                style={{ marginTop: 16 }}
                bordered
                size="small"
              >
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    {paymentStatus === "pending" 
                      ? `Vui lòng thanh toán ${fmtPrice(booking.total_price)} khi đến khách sạn`
                      : `Thanh toán thất bại. Vui lòng thanh toán lại ${fmtPrice(booking.total_price)}`}
                  </p>
                  <Tag
                    color={paymentStatus === "pending" ? "warning" : "error"}
                    style={{ fontSize: 13, padding: "6px 12px", marginBottom: 12 }}
                  >
                    Trạng thái: {paymentStatus === "pending" ? "Chờ thanh toán" : "Thanh toán thất bại"}
                  </Tag>
                  <div>
                    <Button
                      type="primary"
                      size="middle"
                      onClick={() => {
                        navigate("/bookings/payment-method", {
                          state: {
                            bookingId: booking.id,
                            bookingInfo: booking,
                          },
                        });
                      }}
                      style={{
                        background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                        borderColor: "transparent",
                      }}
                    >
                      {paymentStatus === "pending" ? "Thanh toán ngay" : "Thanh toán lại"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-between mt-4">
              <Button size="middle" onClick={() => navigate("/my-bookings")}>
                Xem booking của tôi
              </Button>
              <Space size="small">
                {canCancel && (
                  <Button
                    danger
                    size="middle"
                    onClick={handleCancel}
                    loading={updating}
                  >
                    Hủy booking
                  </Button>
                )}
                <Button size="middle" onClick={() => navigate("/")}>
                  Về trang chủ
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingSuccess;
