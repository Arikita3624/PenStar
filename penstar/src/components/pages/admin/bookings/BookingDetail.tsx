/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getBookingById,
  updateBookingStatus,
  confirmCheckout,
  cancelBooking,
  checkIn,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById } from "@/services/servicesApi";
import type { BookingDetails } from "@/types/bookings";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Spin,
  Card,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  Avatar,
  List,
  Button,
  message,
  Empty,
  Modal,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  DollarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Form, Input } from "antd";

const { Title, Text } = Typography;

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useQuery<BookingDetails | null>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(Number(id)),
    enabled: !!id,
    retry: false,
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInValues, setCheckInValues] = useState({
    id_card: "",
    guest_name: "",
    guest_phone: "",
  });

  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      if (!booking) return;
      setLoadingExtras(true);

      console.log("📦 Booking data:", booking);
      console.log("🛎️ Booking services:", booking.services);
      console.log("🏨 Booking items:", booking.items);

      try {
        const roomIds: string[] = [];
        const serviceIds: string[] = [];

        if (Array.isArray(booking.items)) {
          booking.items.forEach(
            (it: { room_id?: number }) =>
              it.room_id && roomIds.push(String(it.room_id))
          );
        }
        if (Array.isArray(booking.services)) {
          booking.services.forEach(
            (s: { service_id?: number }) =>
              s.service_id && serviceIds.push(String(s.service_id))
          );
        }

        // Don't use Set - we need all room instances even if same room_id
        const uniqueServiceIds = Array.from(new Set(serviceIds));

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)), // Fetch all rooms including duplicates
          Promise.all(uniqueServiceIds.map(getServiceById)),
        ]);

        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          setServices(serviceResults.filter(Boolean) as Services[]);

          // Nếu booking đã checkout (stay_status_id = 3) VÀ phòng đã cleaning/available -> đã confirm rồi
          if (booking.stay_status_id === 3) {
            const hasCleaningRoom = roomResults.some(
              (r) => r && (r.status === "cleaning" || r.status === "available")
            );
            if (hasCleaningRoom) {
              setCheckoutConfirmed(true);
            }
          }
        }
      } catch (err) {
        message.error("Lỗi tải thông tin phòng/dịch vụ");
        console.error(err);
      } finally {
        if (mounted) setLoadingExtras(false);
      }
    };

    loadExtras();
    return () => {
      mounted = false;
    };
  }, [booking]);

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd 'tháng' MM, yyyy", { locale: vi });
  };

  const getStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <Tag color="success">Đã xác nhận</Tag>;
      case "pending":
        return <Tag color="warning">Chờ xác nhận</Tag>;
      case "cancelled":
        return <Tag color="error">Đã hủy</Tag>;
      case "checked_in":
        return <Tag color="processing">Đã nhận phòng</Tag>;
      case "checked_out":
        return <Tag color="default">Đã trả phòng</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const handleApprove = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, { stay_status_id: 1 }); // 1 = reserved (đã duyệt)
      message.success("Đã duyệt booking - Phòng chuyển sang trạng thái Booked");
      refetch();
    } catch (err) {
      console.error("Lỗi duyệt booking:", err);
      message.error("Lỗi duyệt booking");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (paymentStatus: string) => {
    if (!booking || !booking.id) return;

    // Kiểm tra nếu booking đã bị hủy
    if (booking.stay_status_id === 4) {
      message.warning(
        "Không thể chỉnh sửa trạng thái thanh toán khi đơn hàng đã bị hủy"
      );
      return;
    }

    setUpdating(true);
    try {
      // ⚠️ Nếu payment_status = "failed" → tự động hủy booking (stay_status_id = 4)
      if (paymentStatus === "failed") {
        await updateBookingStatus(booking.id, {
          payment_status: paymentStatus,
          stay_status_id: 4, // cancelled
        });
        message.success(
          `Đã cập nhật trạng thái thanh toán: ${paymentStatus} và hủy booking`
        );
      } else {
        await updateBookingStatus(booking.id, {
          payment_status: paymentStatus,
        });
        message.success(`Đã cập nhật trạng thái thanh toán: ${paymentStatus}`);
      }
      refetch();
    } catch (err) {
      console.error("Lỗi cập nhật thanh toán:", err);
      message.error("Không thể cập nhật trạng thái thanh toán");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentMethod = async (paymentMethod: string) => {
    if (!booking || !booking.id) return;

    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, { payment_method: paymentMethod });
      message.success(`Đã cập nhật phương thức thanh toán: ${paymentMethod}`);
      refetch();
    } catch (err) {
      console.error("Lỗi cập nhật phương thức thanh toán:", err);
      message.error("Không thể cập nhật phương thức thanh toán");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRefund = async () => {
    if (!booking || !booking.id) return;
    const newRefundStatus = !booking.is_refunded;

    Modal.confirm({
      title: newRefundStatus ? "Xác nhận hoàn tiền" : "Hủy hoàn tiền",
      content: newRefundStatus
        ? "Bạn có chắc muốn đánh dấu booking này đã hoàn tiền?"
        : "Bạn có chắc muốn hủy trạng thái hoàn tiền?",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateBookingStatus(booking.id!, {
            is_refunded: newRefundStatus,
            payment_status: newRefundStatus ? "refunded" : "failed",
          });
          message.success(
            newRefundStatus
              ? "Đã đánh dấu hoàn tiền thành công"
              : "Đã hủy trạng thái hoàn tiền"
          );
          refetch();
        } catch (err) {
          console.error("Lỗi cập nhật hoàn tiền:", err);
          message.error("Lỗi cập nhật hoàn tiền");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleCancel = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận hủy",
      content:
        "Bạn có chắc muốn hủy booking này? Phòng sẽ trở về trạng thái Available. Trạng thái thanh toán sẽ tự động chuyển thành Failed.",
      onOk: async () => {
        setUpdating(true);
        try {
          await cancelBooking(booking.id!);
          message.success(
            "Đã hủy booking - Phòng chuyển sang trạng thái Available."
          );
          refetch();
        } catch (err) {
          console.error("Lỗi hủy booking:", err);
          const error = err as { response?: { data?: { message?: string } } };
          message.error(error.response?.data?.message || "Lỗi hủy booking");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleConfirmCheckout = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận checkout",
      content:
        "Xác nhận khách đã checkout? Phòng sẽ chuyển sang trạng thái Cleaning.",
      onOk: async () => {
        setUpdating(true);
        try {
          await confirmCheckout(booking.id!);
          setCheckoutConfirmed(true); // Đánh dấu đã confirm
          message.success(
            "Đã xác nhận checkout - Phòng chuyển sang trạng thái Cleaning"
          );
          // Reload rooms data để cập nhật UI
          await refetch();
        } catch (err) {
          console.error("Lỗi xác nhận checkout:", err);
          message.error("Lỗi xác nhận checkout");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleDoCheckIn = async () => {
    if (!booking || !booking.id) return;
    // At least one field should be provided; front-end validator ensured that
    const payload = { ...checkInValues };
    setCheckInLoading(true);
    try {
      await checkIn(booking.id, payload);
      message.success("Check-in thành công");
      setCheckInModalVisible(false);
      // Refresh booking data
      await refetch();
    } catch (err) {
      console.error("Lỗi check-in:", err);
      const error = err as any;
      message.error(error?.response?.data?.message || "Không thể check-in");
    } finally {
      setCheckInLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <Card style={{ maxWidth: 800, margin: "20px auto" }}>
        <Space
          direction="vertical"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Text type="danger">Không thể tải thông tin đặt phòng.</Text>
          <Button type="primary" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <Space
          style={{
            marginBottom: 16,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết đặt phòng
          </Title>
        </Space>

        {/* Booking ID & Status */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">Mã đặt phòng</Text>
              <Title level={4} style={{ margin: "4px 0" }}>
                #{booking.id}
              </Title>
              <Text type="secondary">
                Thời gian đặt:{" "}
                {booking.created_at ? formatDate(booking.created_at) : "—"}
              </Text>
            </Col>
            <Col>{getStatusTag(booking.status || "")}</Col>
          </Row>
        </Card>

        {/* Customer Info */}
        <Card
          title={
            <Space>
              <UserOutlined /> Thông tin khách hàng
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Họ tên</Text>
              <br />
              <Text strong>{booking.customer_name || "—"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                <MailOutlined /> Email
              </Text>
              <br />
              <Text>{booking.email || "—"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">
                <PhoneOutlined /> Số điện thoại
              </Text>
              <br />
              <Text>{booking.phone || "—"}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Phương thức đặt phòng</Text>
              <br />
              <Tag color="blue">📱 Online</Tag>
            </Col>
          </Row>
        </Card>

        {/* Notes - if exists */}
        {booking.notes && (
          <Card title="Ghi chú từ khách hàng" style={{ marginBottom: 16 }}>
            <Text style={{ fontStyle: "italic", color: "#595959" }}>
              {booking.notes}
            </Text>
          </Card>
        )}

        {/* Stay Dates */}
        <Card
          title={
            <Space>
              <CalendarOutlined /> Thời gian lưu trú
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">Nhận phòng</Text>
              <br />
              <Space>
                <ClockCircleOutlined />
                <Text strong>
                  {booking.check_in ? formatDate(booking.check_in) : "—"}
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Text type="secondary">Trả phòng</Text>
              <br />
              <Space>
                <ClockCircleOutlined />
                <Text strong>
                  {booking.check_out ? formatDate(booking.check_out) : "—"}
                </Text>
              </Space>
            </Col>
            <Col span={8}>
              <Text type="secondary">Số đêm</Text>
              <br />
              <Text strong>
                {booking.check_in && booking.check_out
                  ? Math.ceil(
                      (new Date(booking.check_out).getTime() -
                        new Date(booking.check_in).getTime()) /
                        (1000 * 3600 * 24)
                    )
                  : 0}{" "}
                đêm
              </Text>
            </Col>
            {/* Actual check-in timestamp (set when staff checks in) */}
            {booking.checkin_at && (
              <Col span={8}>
                <Text type="secondary">Thời gian nhận phòng (thực tế)</Text>
                <br />
                <Space>
                  <ClockCircleOutlined />
                  <Text strong>
                    {new Date(booking.checkin_at).toLocaleString("vi-VN")}
                  </Text>
                </Space>
              </Col>
            )}
          </Row>
        </Card>

        {/* Rooms with Services */}
        <Card
          title={
            <Space>
              <HomeOutlined /> Phòng đã đặt ({booking.items?.length || 0} phòng)
            </Space>
          }
          style={{ marginBottom: 16 }}
          loading={loadingExtras}
        >
          {rooms.length > 0 ? (
            <List
              dataSource={booking.items?.map((item: any, index: number) => ({
                item,
                room: rooms[index],
                index,
              }))}
              renderItem={({ item, room, index }) => {
                if (!room) return null;

                const numAdults = item.num_adults || 0;
                const numChildren = item.num_children || 0;
                const totalGuests = numAdults + numChildren;
                const specialRequests = item.special_requests;

                // Get services for this specific room
                const roomServices =
                  booking.services?.filter(
                    (s: any) => s.booking_item_id === item.id
                  ) || [];

                return (
                  <List.Item key={index}>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                          {room.thumbnail ? (
                            <Avatar
                              shape="square"
                              size={64}
                              src={room.thumbnail}
                            />
                          ) : (
                            <Avatar
                              shape="square"
                              size={64}
                              icon={<HomeOutlined />}
                            />
                          )}
                          <div>
                            <Space direction="vertical" size={0}>
                              <Text strong>
                                {room.name || `Phòng ${room.id}`}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Loại phòng {room.type_id || "Không xác định"}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <UserOutlined /> {numAdults} người lớn
                                {numChildren > 0
                                  ? `, ${numChildren} trẻ em`
                                  : ""}{" "}
                                (Tổng: {totalGuests} khách)
                              </Text>
                              {specialRequests && (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 12,
                                    fontStyle: "italic",
                                    color: "#1890ff",
                                  }}
                                >
                                  Yêu cầu: {specialRequests}
                                </Text>
                              )}
                            </Space>
                          </div>
                        </div>
                        <Text strong type="success">
                          {formatPrice(room.price || 0)}
                        </Text>
                      </div>

                      {/* Services for this room */}
                      {roomServices.length > 0 && (
                        <div
                          style={{
                            marginTop: 12,
                            marginLeft: 80,
                            paddingLeft: 12,
                            borderLeft: "2px solid #f0f0f0",
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                              display: "block",
                              marginBottom: 8,
                            }}
                          >
                            <TagOutlined /> Dịch vụ bổ sung (
                            {roomServices.length}):
                          </Text>
                          {roomServices.map(
                            (bookingService: any, sIndex: number) => {
                              const service = services.find(
                                (s) => s.id === bookingService.service_id
                              );
                              return (
                                <div
                                  key={sIndex}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 4,
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>
                                    •{" "}
                                    {service?.name ||
                                      `Dịch vụ ${bookingService.service_id}`}
                                    {bookingService.quantity > 1 && (
                                      <Text type="secondary">
                                        {" "}
                                        × {bookingService.quantity}
                                      </Text>
                                    )}
                                  </Text>
                                  <Text
                                    style={{ fontSize: 13, color: "#ff4d4f" }}
                                  >
                                    {formatPrice(
                                      bookingService.total_service_price || 0
                                    )}
                                  </Text>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty description="Không có thông tin phòng" />
          )}
        </Card>

        {/* Services without booking_item_id (old data or general services) */}
        {booking.services &&
          booking.services.some((s: any) => !s.booking_item_id) && (
            <Card
              title={
                <Space>
                  <TagOutlined /> Dịch vụ bổ sung chung
                </Space>
              }
              style={{ marginBottom: 16 }}
              loading={loadingExtras}
            >
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 4,
                  padding: "8px 12px",
                  marginBottom: 16,
                }}
              >
                <Text type="warning" style={{ fontSize: 12, display: "block" }}>
                  Các dịch vụ này chưa được gán cho phòng cụ thể (dữ liệu cũ -
                  trước cập nhật)
                </Text>
              </div>

              <List
                dataSource={(() => {
                  // Nhóm các dịch vụ trùng lặp theo service_id
                  const groupedServices = booking.services
                    .filter((s: any) => !s.booking_item_id)
                    .reduce((acc: any[], curr: any) => {
                      const existing = acc.find(
                        (item) => item.service_id === curr.service_id
                      );
                      if (existing) {
                        // Cộng số lượng và giá (đảm bảo convert sang number)
                        existing.quantity =
                          (existing.quantity || 0) + (curr.quantity || 1);
                        existing.total_service_price =
                          (Number(existing.total_service_price) || 0) +
                          (Number(curr.total_service_price) || 0);
                      } else {
                        acc.push({
                          ...curr,
                          quantity: curr.quantity || 1,
                          total_service_price:
                            Number(curr.total_service_price) || 0,
                        });
                      }
                      return acc;
                    }, []);
                  return groupedServices;
                })()}
                renderItem={(bookingService: any, index: number) => {
                  const service = services.find(
                    (s) => s.id === bookingService.service_id
                  );

                  return (
                    <List.Item key={index}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: "#ff4d4f",
                              verticalAlign: "middle",
                            }}
                            size="large"
                            icon={<TagOutlined />}
                          />
                        }
                        title={
                          <Space direction="vertical" size={0}>
                            <Text strong style={{ fontSize: 15 }}>
                              {service?.name ||
                                `Dịch vụ #${bookingService.service_id}`}
                            </Text>
                          </Space>
                        }
                        description={
                          <div style={{ marginTop: 8 }}>
                            <Space split={<Divider type="vertical" />}>
                              <Tag color="blue">
                                Số lượng: {bookingService.quantity || 1}
                              </Tag>
                              {service?.price && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Đơn giá: {formatPrice(service.price)}
                                </Text>
                              )}
                            </Space>
                          </div>
                        }
                      />
                      <div
                        style={{
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                        }}
                      >
                        <Text strong style={{ fontSize: 16, color: "#ff4d4f" }}>
                          {formatPrice(bookingService.total_service_price || 0)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Thành tiền
                        </Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

        {/* Payment Summary */}
        <Card
          title={
            <Space>
              <DollarOutlined /> Tổng kết thanh toán
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {/* Payment Method */}
            <Row justify="space-between" align="middle">
              <Text>Phương thức thanh toán</Text>
              {booking.stay_status_id === 4 ? (
                // Nếu đã hủy - chỉ hiển thị
                <Tag color="default">
                  {booking.payment_method
                    ? booking.payment_method.toUpperCase()
                    : "—"}
                </Tag>
              ) : (
                <Tag
                  color={
                    booking.payment_method === "cash"
                      ? "green"
                      : booking.payment_method === "momo"
                      ? "magenta"
                      : booking.payment_method === "vnpay"
                      ? "purple"
                      : "default"
                  }
                >
                  {booking.payment_method
                    ? booking.payment_method.toUpperCase()
                    : "—"}
                </Tag>
              )}
            </Row>

            {/* Payment Method Helper Text */}
            {/* Đã xóa helper cho offline booking */}
            {booking.booking_method === "online" && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                🌐 Booking online - Phương thức thanh toán được tự động ghi nhận
                qua cổng thanh toán
              </Text>
            )}

            {/* Payment Status */}
            <Row justify="space-between" align="middle">
              <Text>Trạng thái thanh toán</Text>
              {booking.stay_status_id === 4 ? (
                // Nếu đã hủy - chỉ hiển thị tag FAILED
                <Tag color="red" style={{ fontSize: 14 }}>
                  FAILED
                </Tag>
              ) : (
                <Tag
                  color={
                    booking.payment_status === "paid"
                      ? "green"
                      : booking.payment_status === "failed"
                      ? "red"
                      : "default"
                  }
                >
                  {booking.payment_status
                    ? booking.payment_status.toUpperCase()
                    : "—"}
                </Tag>
              )}
            </Row>
            {booking.stay_status_id === 1 &&
              booking.payment_status !== "paid" && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  * Chỉ có thể cập nhật thanh toán khi ở trạng thái "Đã duyệt"
                  và chưa thanh toán
                </Text>
              )}
            {booking.stay_status_id === 6 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Vui lòng duyệt booking trước khi cập nhật thanh toán
              </Text>
            )}
            {(booking.stay_status_id === 2 ||
              booking.stay_status_id === 3 ||
              booking.stay_status_id === 6) && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                * Không thể thay đổi trạng thái thanh toán sau khi check-in
              </Text>
            )}
            {booking.stay_status_id === 1 &&
              booking.payment_status === "paid" && (
                <Text type="success" style={{ fontSize: 12 }}>
                  ✓ Đã thanh toán - Không thể thay đổi
                </Text>
              )}
            {booking.stay_status_id === 4 && (
              <>
                <Text type="warning" style={{ fontSize: 12 }}>
                  ⚠️ Booking đã hủy. Trạng thái thanh toán = Failed (không thể
                  sửa).
                </Text>
                <Divider style={{ margin: "8px 0" }} />
                <Row justify="space-between" align="middle">
                  <Text>Hoàn tiền cho khách</Text>
                  <Button
                    type={booking.is_refunded ? "default" : "primary"}
                    danger={booking.is_refunded}
                    onClick={handleToggleRefund}
                    loading={updating}
                    disabled={updating}
                  >
                    {booking.is_refunded
                      ? "Hủy hoàn tiền"
                      : "Đánh dấu đã hoàn tiền"}
                  </Button>
                </Row>
                {booking.is_refunded && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    ✓ Đã hoàn tiền cho khách hàng
                  </Text>
                )}
              </>
            )}
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Text>Tiền phòng</Text>
              <Text strong>{formatPrice(booking.total_room_price || 0)}</Text>
            </Row>
            {booking.total_service_price ? (
              <Row justify="space-between">
                <Text>Dịch vụ bổ sung</Text>
                <Text strong>{formatPrice(booking.total_service_price)}</Text>
              </Row>
            ) : null}
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                Tổng cộng
              </Title>
              <Title level={4} type="danger" style={{ margin: 0 }}>
                {formatPrice(booking.total_amount || 0)}
              </Title>
            </Row>
          </Space>
        </Card>

        {/* Action Buttons */}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>

            {/* Nút Đổi phòng - Admin có thể đổi khi pending (6) hoặc reserved (1) và chưa đổi quá 1 lần */}
            {(booking.stay_status_id === 6 || booking.stay_status_id === 1) &&
              (booking.change_count || 0) < 1 &&
              booking.items &&
              booking.items.length > 0 && (
                <Button
                  type="default"
                  onClick={() => {
                    const item = booking.items[0];
                    const room = rooms.find((r) => r.id === item.room_id);
                    navigate(`/admin/bookings/${booking.id}/change-room`, {
                      state: {
                        bookingItemId: item.id,
                        currentRoom: {
                          id: item.room_id,
                          name: room?.name || `Phòng ${item.room_id}`,
                          price:
                            item.room_price /
                            Math.ceil(
                              (new Date(item.check_out).getTime() -
                                new Date(item.check_in).getTime()) /
                                (1000 * 60 * 60 * 24)
                            ), // Price per night
                          type_id: room?.type_id || 0,
                        },
                        checkIn: item.check_in,
                        checkOut: item.check_out,
                        numAdults: item.num_adults || 1,
                        numChildren: item.num_children || 0,
                      },
                    });
                  }}
                  disabled={updating}
                >
                  Đổi phòng
                </Button>
              )}

              {/* Check-in button: show when booking is reserved (1) and payment paid */}
              {booking.stay_status_id === 1 && booking.payment_status === "paid" && (
                <Button
                  type="primary"
                  onClick={() => setCheckInModalVisible(true)}
                  loading={updating}
                >
                  Check-in
                </Button>
              )}

            {/* Chỉ hiện nút Duyệt khi đang chờ xác nhận (stay_status_id === 6 = pending) */}
            {booking.stay_status_id === 6 && (
              <Button
                type="primary"
                onClick={handleApprove}
                loading={updating}
                disabled={updating}
              >
                Duyệt
              </Button>
            )}
            {/* Hiện nút Hủy khi booking chưa bị hủy (stay_status_id !== 4) và chưa checked_out */}
            {booking.stay_status_id !== 4 && booking.stay_status_id !== 3 && (
              <Button
                danger
                onClick={handleCancel}
                loading={updating}
                disabled={updating}
              >
                Hủy
              </Button>
            )}
            {/* Hiện nút Xác nhận checkout khi khách đã checkout (stay_status_id === 3 = checked_out) VÀ chưa confirm */}
            {booking.stay_status_id === 3 && !checkoutConfirmed && (
              <Button
                type="primary"
                onClick={handleConfirmCheckout}
                loading={updating}
                disabled={updating}
              >
                Xác nhận checkout
              </Button>
            )}
          </Space>
        </div>
      </div>
      {/* Check-in Modal */}
      <Modal
        title={`Check-in — Booking #${booking.id}`}
        open={checkInModalVisible}
        onCancel={() => setCheckInModalVisible(false)}
        onOk={handleDoCheckIn}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={checkInLoading}
      >
        <Form layout="vertical">
          <Form.Item label="Căn cước / CMND">
            <Input
              value={checkInValues.id_card}
              onChange={(e) =>
                setCheckInValues((s) => ({ ...s, id_card: e.target.value }))
              }
              placeholder="Số căn cước/CMND"
            />
          </Form.Item>
          <Form.Item label="Họ tên khách">
            <Input
              value={checkInValues.guest_name}
              onChange={(e) =>
                setCheckInValues((s) => ({ ...s, guest_name: e.target.value }))
              }
              placeholder="Họ tên"
            />
          </Form.Item>
          <Form.Item label="Số điện thoại">
            <Input
              value={checkInValues.guest_phone}
              onChange={(e) =>
                setCheckInValues((s) => ({ ...s, guest_phone: e.target.value }))
              }
              placeholder="Số điện thoại"
            />
          </Form.Item>
          <Form.Item>
            <Form.Item noStyle>
              <Text type="secondary">
                Vui lòng nhập ít nhất một trường thông tin để lưu hồ sơ khách.
              </Text>
            </Form.Item>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookingDetail;
