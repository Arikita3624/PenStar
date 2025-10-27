import {
  getBookingById,
  updateBookingStatus,
  confirmCheckout,
  cancelBooking,
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

  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      if (!booking) return;
      setLoadingExtras(true);

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

        const uniqueRoomIds = Array.from(new Set(roomIds));
        const uniqueServiceIds = Array.from(new Set(serviceIds));

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(uniqueRoomIds.map(getRoomID)),
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
      await updateBookingStatus(booking.id, { payment_status: paymentStatus });
      message.success(`Đã cập nhật trạng thái thanh toán: ${paymentStatus}`);
      refetch();
    } catch (err) {
      console.error("Lỗi cập nhật thanh toán:", err);
      message.error("Không thể cập nhật trạng thái thanh toán");
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
          </Row>
        </Card>

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
          </Row>
        </Card>

        {/* Rooms */}
        <Card
          title={
            <Space>
              <HomeOutlined /> Phòng đã đặt
            </Space>
          }
          style={{ marginBottom: 16 }}
          loading={loadingExtras}
        >
          {rooms.length > 0 ? (
            <List
              dataSource={rooms}
              renderItem={(room) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      room.thumbnail ? (
                        <Avatar shape="square" size={64} src={room.thumbnail} />
                      ) : (
                        <Avatar
                          shape="square"
                          size={64}
                          icon={<HomeOutlined />}
                        />
                      )
                    }
                    title={
                      <Text strong>{room.name || `Phòng ${room.id}`}</Text>
                    }
                    description={`Loại phòng ${
                      room.type_id || "Không xác định"
                    }`}
                  />
                  <Text strong type="success">
                    {room.price ? formatPrice(room.price) : "—"}
                  </Text>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Không có thông tin phòng" />
          )}
        </Card>

        {/* Services */}
        {services.length > 0 && (
          <Card
            title={
              <Space>
                <TagOutlined /> Dịch vụ bổ sung
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={services}
              renderItem={(service) => (
                <List.Item>
                  <List.Item.Meta
                    title={service.name || `Dịch vụ ${service.id}`}
                    description={service.description || ""}
                  />
                  <Text strong type="danger">
                    {service.price ? formatPrice(service.price) : "Miễn phí"}
                  </Text>
                </List.Item>
              )}
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
            <Row justify="space-between" align="middle">
              <Text>Trạng thái thanh toán</Text>
              {booking.stay_status_id === 4 ? (
                // Nếu đã hủy - chỉ hiển thị tag FAILED
                <Tag color="red" style={{ fontSize: 14 }}>
                  FAILED
                </Tag>
              ) : booking.stay_status_id === 1 &&
                booking.payment_status !== "paid" ? (
                // Chỉ cho phép sửa khi: đã duyệt (stay_status_id === 1) VÀ chưa thanh toán
                <Select
                  value={booking.payment_status}
                  style={{ width: 200 }}
                  onChange={handleUpdatePayment}
                  disabled={updating}
                  options={[
                    { label: "Pending (Chờ thanh toán)", value: "pending" },
                    { label: "Paid (Đã thanh toán)", value: "paid" },
                    { label: "Failed (Thất bại)", value: "failed" },
                  ]}
                />
              ) : (
                // Tất cả các trường hợp khác - chỉ xem, không sửa
                <Tag
                  color={
                    booking.payment_status === "paid"
                      ? "green"
                      : booking.payment_status === "pending"
                      ? "gold"
                      : "red"
                  }
                  style={{ fontSize: 14 }}
                >
                  {booking.payment_status?.toUpperCase() || "N/A"}
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
            {/* Chỉ hiện nút Hủy khi đã duyệt (stay_status_id === 1 = reserved) */}
            {booking.stay_status_id === 1 && (
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
    </div>
  );
};

export default BookingDetail;
