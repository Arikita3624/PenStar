import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Button, List, Spin, Tag, message, Modal } from "antd";
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
  const [loading, setLoading] = React.useState(!initial);
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
      if (Array.isArray(data.services) && data.services.length > 0) {
        const serviceIds = Array.from(
          new Set(
            data.services
              .map((s: { service_id?: number }) => s.service_id)
              .filter((id): id is number => id != null)
          )
        );
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
    if (initial && initial.id && String(initial.id) === id) {
      setBooking(initial);
      setLoading(false);
      setTimeout(() => {
        fetchBooking();
      }, 100);
    } else {
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
  const canCancel = statusId === 6 || statusId === 1;
  const totalAdults = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_adults || 0), 0)
    : 0;
  const totalChildren = Array.isArray(booking?.items)
    ? booking!.items.reduce((sum, item) => sum + (item.num_children || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Thông tin đặt phòng
          </h1>
          <div className="text-center mt-2">
            <span className="text-gray-600">
              Booking #{booking?.id ?? id ?? "-"}
            </span>
            <span className="mx-2">•</span>
            {getStatusDisplay(
              booking?.stay_status_id,
              booking?.stay_status_name
            )}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {statusId === 6 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <div className="font-bold text-yellow-800 mb-1">
                    Đang chờ xác nhận
                  </div>
                  <div className="text-yellow-700 text-sm">
                    Booking của bạn đang chờ admin xác nhận. Bạn có thể hủy
                    booking nếu muốn.
                  </div>
                </div>
              </div>
            </div>
          )}
          {statusId === 1 && paymentStatus !== "paid" && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <div className="font-bold text-orange-800 mb-1">
                    Chờ thanh toán
                  </div>
                  <div className="text-orange-700 text-sm">
                    Booking đã được xác nhận! Vui lòng thanh toán để có thể
                    check-in.
                  </div>
                </div>
              </div>
            </div>
          )}
          {statusId === 1 && paymentStatus === "paid" && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-bold text-blue-800 mb-1">
                    Đã xác nhận và thanh toán
                  </div>
                  <div className="text-blue-700 text-sm">
                    Booking đã được xác nhận và thanh toán! Bạn có thể check-in
                    khi đến phòng.
                  </div>
                </div>
              </div>
            </div>
          )}
          {statusId === 2 && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="font-bold text-green-800 mb-1">
                    Đã check-in
                  </div>
                  <div className="text-green-700 text-sm">
                    Bạn đã check-in. Chúc bạn có kỳ nghỉ vui vẻ!
                  </div>
                </div>
              </div>
            </div>
          )}
          {statusId === 4 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <div className="font-bold text-red-800 mb-1">
                    Booking đã hủy
                  </div>
                  <div className="text-red-700 text-sm">
                    Booking đã bị hủy. Phòng đã trở về trạng thái Available.
                    {booking?.is_refunded && (
                      <span className="block mt-1 text-purple-600 font-semibold">
                        💰 Tiền đã được hoàn lại
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
              Thông tin người đặt phòng
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Khách hàng</span>
                <span className="font-semibold text-gray-900">
                  {booking?.customer_name ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian đặt</span>
                <span className="font-semibold text-gray-900">
                  {booking?.created_at
                    ? dayjs(booking.created_at as string).format(
                        "DD/MM/YYYY HH:mm"
                      )
                    : "-"}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
              Thông tin đặt phòng
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Số phòng</span>
                <span className="font-semibold text-gray-900">
                  {booking?.items?.length || 0} phòng
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số người lớn</span>
                <span className="font-semibold text-gray-900">
                  {totalAdults}
                </span>
              </div>
              {totalChildren > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Số trẻ em</span>
                  <span className="font-semibold text-gray-900">
                    {totalChildren} trẻ
                  </span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm text-blue-600 flex items-start gap-2">
                  <span>📧</span>
                  <span>
                    Thông tin phòng cụ thể (số phòng, tầng) đã được gửi qua
                    email của bạn
                  </span>
                </p>
              </div>
            </div>
          </div>
          {Array.isArray(booking?.services) && booking.services.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
                Dịch vụ
              </h2>
              <List
                size="small"
                dataSource={booking.services}
                renderItem={(s: BookingService) => {
                  const serviceInfo = services[s.service_id];
                  return (
                    <List.Item className="border-b-0">
                      <div className="w-full">
                        <div className="font-semibold text-gray-800">
                          {serviceInfo?.name || `Dịch vụ #${s.service_id}`}
                        </div>
                        <div className="text-sm text-gray-600">
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phương thức</span>
                <span className="font-semibold text-gray-900">
                  {booking?.payment_method === "vnpay" && "💰 VNPAY"}
                  {booking?.payment_method === "momo" && "📱 Ví MoMo"}
                  {booking?.payment_method === "cash" && "💵 Tiền mặt"}
                  {!booking?.payment_method && "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Trạng thái</span>
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
                            : "default"
                  }
                >
                  {paymentStatus?.toUpperCase() || "-"}
                </Tag>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Đặt phòng</span>
                <span className="font-semibold text-gray-900">
                  {booking?.booking_method === "online"
                    ? "🌐 Online"
                    : "🏨 Trực tiếp"}
                </span>
              </div>
            </div>
            {booking?.id &&
              (paymentStatus === "pending" || paymentStatus === "failed") && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    {paymentStatus === "pending"
                      ? `Vui lòng thanh toán ${fmtPrice(booking.total_price)} VND`
                      : `Thanh toán thất bại. Vui lòng thử lại`}
                  </p>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => {
                      navigate("/bookings/payment-method", {
                        state: { bookingId: booking.id, bookingInfo: booking },
                      });
                    }}
                    style={{
                      backgroundColor: "#eab308",
                      borderColor: "#eab308",
                      height: "48px",
                    }}
                  >
                    {paymentStatus === "pending"
                      ? "THANH TOÁN NGAY"
                      : "THANH TOÁN LẠI"}
                  </Button>
                </div>
              )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
              Chi tiết phòng đã đặt
            </h2>
            <div className="space-y-4">
              {Array.isArray(booking?.items) && booking.items.length > 0 ? (
                booking.items.map((item, idx) => {
                  // Calculate surcharge using correct fields
                  const surcharge =
                    (item.extra_fees || 0) +
                    (item.extra_adult_fees || 0) +
                    (item.extra_child_fees || 0);
                  return (
                    <div
                      key={idx}
                      className="border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">
                          Phòng {idx + 1}
                        </span>
                        <span className="text-gray-600">
                          ID phòng: {item.room_id}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Số người lớn: {item.num_adults || 0}</span>
                        <span>Số trẻ em: {item.num_children || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Giá phụ phí</span>
                        <span className="font-semibold text-red-600">
                          {fmtPrice(surcharge)} VND
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Giá phòng</span>
                        <span className="font-semibold text-gray-900">
                          {fmtPrice(item.room_type_price || item.room_price)}{" "}
                          VND
                        </span>
                      </div>
                      {item.special_requests && (
                        <div className="text-xs text-gray-500 italic mt-1">
                          {item.special_requests}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500">
                  Không có phòng nào được đặt.
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b">
              Chi tiết thanh toán
            </h2>
            {booking?.original_total && booking?.discount_amount ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền gốc</span>
                  <span className="line-through text-gray-400">
                    {fmtPrice(booking.original_total)} VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã giảm giá</span>
                  <div className="text-right">
                    <Tag color="green">{booking.promo_code}</Tag>
                    <span className="ml-2 text-green-600 font-semibold">
                      -{fmtPrice(booking.discount_amount)} VND
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-between items-baseline">
                  <span className="text-lg font-bold text-gray-800">
                    Tổng giá
                  </span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {fmtPrice(booking?.total_price)} VND
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-bold text-gray-800">
                  Tổng giá
                </span>
                <span className="text-2xl font-bold text-yellow-600">
                  {fmtPrice(booking?.total_price)} VND
                </span>
              </div>
            )}
            {booking?.is_refunded && (
              <div className="mt-4 pt-4 border-t">
                <Tag color="purple" className="w-full text-center">
                  ✓ Đã hoàn tiền
                </Tag>
              </div>
            )}
            {/* Action Buttons sau phần giá */}
            <div className="flex gap-4 mt-8 justify-end">
              {canCancel && (
                <Button
                  type="primary"
                  danger
                  size="middle"
                  onClick={handleCancel}
                  loading={updating}
                  style={{
                    height: "40px",
                    minWidth: "120px",
                    fontSize: "15px",
                  }}
                >
                  Hủy booking
                </Button>
              )}
              <Button
                type="primary"
                size="middle"
                onClick={() => navigate("/")}
                style={{
                  backgroundColor: "#eab308",
                  borderColor: "#eab308",
                  color: "#fff",
                  height: "40px",
                  minWidth: "120px",
                  fontSize: "15px",
                }}
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
