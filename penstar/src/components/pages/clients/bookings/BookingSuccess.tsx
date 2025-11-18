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
  Select,
  InputNumber,
} from "antd";
import {
  updateMyBooking,
  cancelBooking,
  getBookingById,
} from "@/services/bookingsApi";
import { getServices } from "@/services/servicesApi";
import { requestService } from "@/services/bookingsApi";
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
  const [serviceModalVisible, setServiceModalVisible] = React.useState(false);
  const [availableServices, setAvailableServices] = React.useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = React.useState<number | null>(null);
  const [serviceQty, setServiceQty] = React.useState<number>(1);
  const [serviceSubmitting, setServiceSubmitting] = React.useState(false);

  const fetchBooking = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBookingById(Number(id));
      setBooking(data);
    } catch {
      setBooking(null);
    } finally {
      setLoading(false);
    }
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

  const openServiceModal = async () => {
    try {
      setServiceModalVisible(true);
      const data = await getServices();
      setAvailableServices(data || []);
      if (data && data.length) setSelectedServiceId(data[0].id);
    } catch (err) {
      message.error("Không thể tải danh sách dịch vụ");
    }
  };

  const handleSubmitService = async () => {
    if (!booking?.id || !selectedServiceId) return;
    setServiceSubmitting(true);
    try {
      // Find service price
      const svc = availableServices.find((s) => s.id === selectedServiceId);
      const price = svc ? Number(svc.price || 0) : 0;
      const total_service_price = price * serviceQty;
      await requestService({ booking_id: booking.id, service_id: selectedServiceId, quantity: serviceQty, total_service_price });
      message.success("Yêu cầu dịch vụ đã gửi");
      setServiceModalVisible(false);
      fetchBooking();
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi gửi yêu cầu dịch vụ");
    } finally {
      setServiceSubmitting(false);
    }
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

  // Chỉ cho check-in khi: reserved (1) VÀ payment = paid
  const canCheckIn = statusId === 1 && paymentStatus === "paid";
  // Chỉ cho check-out khi: checked_in (2)
  const canCheckOut = statusId === 2;
  // Có thể hủy khi: pending (6) HOẶC reserved (1)
  // Backend sẽ kiểm tra thêm điều kiện 24h
  const canCancel = statusId === 6 || statusId === 1;
  // Có thể đổi phòng khi: pending (6) HOẶC reserved (1), VÀ chưa đổi quá 1 lần
  const canChangeRoom =
    (statusId === 6 || statusId === 1) && (booking?.change_count || 0) < 1;

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
                    <div className="text-gray-700 text-sm">
                      Cảm ơn bạn đã checkout! Chờ admin xác nhận để hoàn tất.
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
                  {booking?.items?.[0] && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số người lớn:</span>
                        <span className="font-semibold">
                          {booking.items[0].num_adults || 1} người
                        </span>
                      </div>
                      {(booking.items[0].num_children || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Số trẻ em:</span>
                          <span className="font-semibold">
                            {booking.items[0].num_children} trẻ
                          </span>
                        </div>
                      )}
                    </>
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
            <div className="mt-3">
              <h3 className="mb-1.5 font-semibold text-sm">Dịch vụ</h3>
              <List
                size="small"
                dataSource={booking?.services ?? []}
                renderItem={(s) => (
                  <List.Item>
                    <div className="text-sm">
                      <div className="font-semibold">
                        Dịch vụ #{s.service_id}
                      </div>
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
              <Card
                title="💳 Thanh toán"
                style={{ marginTop: 16 }}
                bordered
                size="small"
              >
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ fontSize: 14, marginBottom: 12 }}>
                    Vui lòng thanh toán{" "}
                    <strong>{fmtPrice(booking.total_price)}</strong> khi đến
                    khách sạn
                  </p>
                  <Tag
                    color="warning"
                    style={{ fontSize: 13, padding: "6px 12px" }}
                  >
                    Trạng thái: Chờ thanh toán
                  </Tag>
                </div>
              </Card>
            )}

            <div className="flex justify-between mt-4">
              <Button size="middle" onClick={() => navigate("/my-bookings")}>
                Xem booking của tôi
              </Button>
              <Space size="small">
                {canCheckIn && (
                  <Button
                    type="primary"
                    size="middle"
                    onClick={handleCheckIn}
                    loading={updating}
                  >
                    Check-in
                  </Button>
                )}
                {!canCheckIn && statusId === 1 && paymentStatus !== "paid" && (
                  <Button type="primary" size="middle" disabled>
                    Check-in (Chờ thanh toán)
                  </Button>
                )}
                {canCheckOut && (
                  <Button
                    type="primary"
                    danger
                    size="middle"
                    onClick={handleCheckOut}
                    loading={updating}
                  >
                    Check-out
                  </Button>
                )}
                {canChangeRoom && booking?.items?.[0] && (
                  <Button
                    type="default"
                    size="middle"
                    onClick={() => {
                      // Chuyển tất cả phòng sang trang đổi phòng
                      navigate(`/bookings/${booking.id}/change-room`, {
                        state: {
                          bookingId: booking.id,
                          items: booking.items.map((item) => {
                            const nights = Math.ceil(
                              (new Date(item.check_out).getTime() -
                                new Date(item.check_in).getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                              return {
                              bookingItemId: item.id,
                              currentRoom: {
                                id: item.room_id,
                                name: item.room_name || `Phòng ${item.room_id}`,
                                price: item.room_price / nights,
                                type_id: item.type_id || item.room_id,
                              },
                              checkIn: item.check_in,
                              checkOut: item.check_out,
                              numAdults: item.num_adults || 1,
                              numChildren: item.num_children || 0,
                            };
                          }),
                        },
                      });
                    }}
                  >
                    Đổi phòng
                  </Button>
                )}
                {statusId === 2 && (
                  <Button size="middle" onClick={openServiceModal}>
                    Yêu cầu dịch vụ
                  </Button>
                )}
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
      <Modal
        title="Yêu cầu dịch vụ"
        visible={serviceModalVisible}
        onCancel={() => setServiceModalVisible(false)}
        onOk={handleSubmitService}
        confirmLoading={serviceSubmitting}
        okText="Gửi yêu cầu"
      >
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Chọn dịch vụ</div>
            <Select
              style={{ width: "100%" }}
              value={selectedServiceId ?? undefined}
              onChange={(v) => setSelectedServiceId(Number(v))}
            >
              {availableServices.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name} — {fmtPrice(s.price)} VND
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-sm mb-1">Số lượng</div>
            <InputNumber min={1} value={serviceQty} onChange={(v) => setServiceQty(Number(v || 1))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingSuccess;
