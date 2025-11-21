/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Spin,
  Modal,
  message,
  List,
  Avatar,
  Divider,
  Space,
  Image,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  DollarOutlined,
  TagOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
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
            (it: any) => it.room_id && roomIds.push(String(it.room_id))
          );
        }
        if (Array.isArray(booking.services)) {
          booking.services.forEach(
            (s: any) => s.service_id && serviceIds.push(String(s.service_id))
          );
        }

        const uniqueServiceIds = Array.from(new Set(serviceIds));

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)),
          Promise.all(uniqueServiceIds.map(getServiceById)),
        ]);

        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          setServices(serviceResults.filter(Boolean) as Services[]);

          if (booking.stay_status_id === 3) {
            const hasCleaningRoom = roomResults.some(
              (r): r is Room =>
                !!r && (r.status === "cleaning" || r.status === "available")
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
        return <Tag>{status || "—"}</Tag>;
    }
  };

  const handleApprove = async () => {
    if (!booking?.id) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, { stay_status_id: 1 });
      message.success("Đã duyệt booking - Phòng chuyển sang trạng thái Booked");
      refetch();
    } catch (err) {
      console.error("Lỗi duyệt booking:", err);
      message.error("Lỗi duyệt booking");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleRefund = async () => {
    if (!booking?.id) return;
    const newRefundStatus = !booking.is_refunded;

    Modal.confirm({
      title: newRefundStatus ? "Xác nhận hoàn tiền" : "Hủy hoàn tiền",
      content: newRefundStatus
        ? "Bạn có chắc muốn đánh dấu booking này đã hoàn tiền?"
        : "Bạn có chắc muốn hủy trạng thái hoàn tiền?",
      onOk: async () => {
        setUpdating(true);
        try {
          await updateBookingStatus(booking.id, {
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
    if (!booking?.id) return;
    Modal.confirm({
      title: "Xác nhận hủy",
      content:
        "Bạn có chắc muốn hủy booking này? Phòng sẽ trở về trạng thái Available. Trạng thái thanh toán sẽ tự động chuyển thành Failed.",
      onOk: async () => {
        setUpdating(true);
        try {
          await cancelBooking(booking.id);
          message.success(
            "Đã hủy booking - Phòng chuyển sang trạng thái Available."
          );
          refetch();
        } catch (err: any) {
          console.error("Lỗi hủy booking:", err);
          message.error(err.response?.data?.message || "Lỗi hủy booking");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleConfirmCheckout = async () => {
    if (!booking?.id) return;
    Modal.confirm({
      title: "Xác nhận checkout",
      content:
        "Xác nhận khách đã checkout? Phòng sẽ chuyển sang trạng thái Cleaning.",
      onOk: async () => {
        setUpdating(true);
        try {
          await confirmCheckout(booking.id);
          setCheckoutConfirmed(true);
          message.success(
            "Đã xác nhận checkout - Phòng chuyển sang trạng thái Cleaning"
          );
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
        <Card style={{ marginBottom: 20 }}>
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
          </Row>
          <Col></Col>
        </Card>

        {/* Customer Info */}
        <Card
          title={
            <Space>
              <UserOutlined /> Thông tin khách hàng
            </Space>
          }
          style={{ marginBottom: 20, border: "1px solid #f0f0f0" }}
        >
          <Row gutter={32} style={{ marginBottom: 24 }}>
            <Col span={12} style={{ marginBottom: 20 }}>
              <Text type="secondary">Họ tên</Text>
              <div style={{ marginTop: 6 }}>
                <Text strong>{booking.customer_name || "—"}</Text>
              </div>
            </Col>
            <Col span={12} style={{ marginBottom: 20 }}>
              <Text type="secondary">
                <MailOutlined /> Email
              </Text>
              <div style={{ marginTop: 6 }}>
                <Text>{booking.email || "—"}</Text>
              </div>
            </Col>
            <Col span={12} style={{ marginBottom: 20 }}>
              <Text type="secondary">
                <PhoneOutlined /> Số điện thoại
              </Text>
              <div style={{ marginTop: 6 }}>
                <Text>{booking.phone || "—"}</Text>
              </div>
            </Col>
            <Col span={12} style={{ marginBottom: 20 }}>
              <Text type="secondary">Phương thức đặt phòng</Text>
              <div style={{ marginTop: 6 }}>
                <Tag color="blue">Online</Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Notes */}
        {booking.notes && (
          <Card title="Ghi chú từ khách hàng" style={{ marginBottom: 16 }}>
            <Text style={{ fontStyle: "italic", color: "#595959" }}>
              {booking.notes}
            </Text>
          </Card>
        )}

        {/* Rooms grouped by room type */}
        <Card
          className="mb-5 rounded-xl shadow-sm"
          title={
            <Space className="text-base">
              <HomeOutlined className="text-blue-600" /> Phòng đã đặt (
              {booking.items?.length || 0} phòng)
            </Space>
          }
          loading={loadingExtras}
          style={{ marginBottom: 20 }}
        >
          {rooms.length > 0 ? (
            (() => {
              const grouped: Record<
                string,
                {
                  typeName: string;
                  typePrice: number;
                  rooms: Array<{ room: Room; item: any }>;
                }
              > = {};

              booking.items?.forEach((item: any, idx: number) => {
                const room = rooms[idx];
                if (!room) return;

                const typeId = room.type_id?.toString() || "unknown";
                const typeName = room.room_type_name?.trim()
                  ? room.room_type_name
                  : item.room_type_name?.trim()
                    ? item.room_type_name
                    : `Loại phòng ${typeId}`;

                const typePrice =
                  item.room_type_price || room.room_type_price || 0;

                if (!grouped[typeId]) {
                  grouped[typeId] = { typeName, typePrice, rooms: [] };
                }
                grouped[typeId].rooms.push({ room, item });
              });

              return Object.entries(grouped).map(([typeId, group]) => (
                <div key={typeId} className="mb-7 last:mb-0">
                  <div className="flex justify-between items-center mb-5 px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h4 className="text-lg font-bold text-blue-800 m-0">
                      {group.typeName}
                    </h4>
                    <span className="text-lg font-semibold text-green-600">
                      {formatPrice(group.typePrice)}{" "}
                      <span className="text-sm font-normal text-green-700">
                        / đêm
                      </span>
                    </span>
                  </div>

                  <div className="space-y-5">
                    {group.rooms.map(({ room, item }, i) => {
                      const totalGuests =
                        (item.num_adults || 0) + (item.num_children || 0);
                      const roomServices =
                        booking.services?.filter(
                          (s: any) => s.booking_item_id === item.id
                        ) || [];

                      return (
                        <div
                          key={i}
                          className="flex gap-5 items-start bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <Image
                            src={room.thumbnail || "/placeholder.jpg"}
                            width={90}
                            height={90}
                            alt={room.name || `Phòng ${room.id}`}
                            className="rounded-lg object-cover flex-shrink-0 shadow-sm"
                            fallback="/placeholder-room.jpg"
                          />

                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 m-0">
                              {room.name || `Phòng ${room.id}`}
                            </h3>

                            <div className="mt-3 flex items-center text-gray-600">
                              <UserOutlined className="mr-2 text-blue-600" />
                              <span className="font-medium">
                                {item.num_adults} người lớn
                                {item.num_children > 0 &&
                                  `, ${item.num_children} trẻ em`}
                              </span>
                              <span className="ml-3 text-blue-600 font-semibold">
                                (Tổng: {totalGuests} khách)
                              </span>
                            </div>

                            {item.special_requests && (
                              <div className="mt-3 text-sm italic text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                                Yêu cầu: {item.special_requests}
                              </div>
                            )}

                            {roomServices.length > 0 && (
                              <div className="mt-4">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  Dịch vụ kèm theo:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {roomServices.map((s: any) => (
                                    <Tag
                                      key={s.id}
                                      color="orange"
                                      className="text-xs font-medium"
                                    >
                                      {s.name}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          ) : (
            <Text type="secondary">Không có phòng nào được đặt.</Text>
          )}
        </Card>

        {/* Dịch vụ chung (không gán phòng) */}
        {booking.services &&
          booking.services.some((s: any) => !s.booking_item_id) && (
            <Card
              title={
                <Space>
                  <TagOutlined /> Dịch vụ bổ sung chung
                </Space>
              }
              style={{ marginBottom: 24 }}
              loading={loadingExtras}
            >
              <div
                style={{
                  background: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <Text type="warning" strong style={{ fontSize: 13 }}>
                  Các dịch vụ này chưa được gán cho phòng cụ thể (dữ liệu cũ)
                </Text>
              </div>

              <List
                dataSource={(() => {
                  const groupedServices = booking.services
                    .filter((s: any) => !s.booking_item_id)
                    .reduce((acc: any[], curr: any) => {
                      const existing = acc.find(
                        (item) => item.service_id === curr.service_id
                      );
                      if (existing) {
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
                renderItem={(bookingService: any) => {
                  const service = services.find(
                    (s) => s.id === bookingService.service_id
                  );

                  return (
                    <List.Item>
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
                          <Text strong style={{ fontSize: 15 }}>
                            {service?.name ||
                              `Dịch vụ #${bookingService.service_id}`}
                          </Text>
                        }
                        description={
                          <Space split={<Divider type="vertical" />}>
                            <Tag color="blue">
                              Số lượng: {bookingService.quantity || 1}
                            </Tag>
                            {service?.price && (
                              <Text type="secondary">
                                Đơn giá: {formatPrice(service.price)}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                      <div style={{ textAlign: "right" }}>
                        <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
                          {formatPrice(bookingService.total_service_price || 0)}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Thành tiền
                        </Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          )}

        {/* Payment Summary - ĐÃ ĐƯỢC CĂN CHỈNH ĐẸP, THOÁNG HƠN */}
        <Card
          title={
            <Space>
              <DollarOutlined /> Tổng kết thanh toán
            </Space>
          }
          style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <div style={{ padding: "8px 0" }}>
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Text strong style={{ fontSize: 15 }}>
                Phương thức thanh toán
              </Text>
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
                style={{ fontSize: 14, padding: "4px 12px" }}
              >
                {booking.payment_method
                  ? booking.payment_method.toUpperCase()
                  : null}
              </Tag>
            </Row>

            {booking.booking_method === "online" && (
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 16, fontSize: 13 }}
              >
                Booking online - Phương thức thanh toán được tự động ghi nhận
                qua cổng thanh toán
              </Text>
            )}

            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Text strong style={{ fontSize: 15 }}>
                Trạng thái thanh toán
              </Text>
              <Tag
                color={
                  booking.payment_status === "paid"
                    ? "green"
                    : booking.payment_status === "failed"
                      ? "red"
                      : "default"
                }
                style={{ fontSize: 14, padding: "4px 12px" }}
              >
                {booking.payment_status
                  ? booking.payment_status.toUpperCase()
                  : "—"}
              </Tag>
            </Row>

            {booking.stay_status_id === 4 && (
              <>
                <Text
                  type="warning"
                  style={{ display: "block", marginBottom: 16, fontSize: 13 }}
                >
                  Booking đã hủy. Trạng thái thanh toán = Failed (không thể
                  sửa).
                </Text>
                <Divider style={{ margin: "16px 0" }} />
                <Row
                  justify="space-between"
                  align="middle"
                  style={{ marginBottom: 12 }}
                >
                  <Text strong>Hoàn tiền cho khách</Text>
                  <Button
                    type={booking.is_refunded ? "default" : "primary"}
                    danger={booking.is_refunded}
                    onClick={handleToggleRefund}
                    loading={updating}
                    disabled={updating}
                    size="middle"
                  >
                    {booking.is_refunded
                      ? "Hủy hoàn tiền"
                      : "Đánh dấu đã hoàn tiền"}
                  </Button>
                </Row>
                {booking.is_refunded && (
                  <Text type="success" style={{ fontSize: 13 }}>
                    Đã hoàn tiền cho khách hàng
                  </Text>
                )}
              </>
            )}

            <Divider style={{ margin: "24px 0" }} />

            <Row justify="space-between" style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15 }}>Tiền phòng</Text>
              <Text strong style={{ fontSize: 18 }}>
                {formatPrice(booking.total_room_price || 0)}
              </Text>
            </Row>

            {booking.total_service_price ? (
              <Row justify="space-between" style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 15 }}>Dịch vụ bổ sung</Text>
                <Text strong style={{ fontSize: 18 }}>
                  {formatPrice(booking.total_service_price)}
                </Text>
              </Row>
            ) : null}

            <Divider style={{ margin: "24px 0" }} />

            <Row justify="space-between">
              <Title level={3} style={{ margin: 0, fontWeight: "bold" }}>
                Tổng cộng
              </Title>
              <Title
                level={3}
                type="danger"
                style={{ margin: 0, fontWeight: "bold" }}
              >
                {formatPrice(booking.total_amount || 0)}
              </Title>
            </Row>
          </div>
        </Card>

        {/* Action Buttons */}
        <div style={{ marginTop: 32, textAlign: "right" }}>
          <Space size="middle">
            <Button onClick={() => navigate(-1)}>Quay lại</Button>

            {(booking.stay_status_id === 6 || booking.stay_status_id === 1) &&
              (booking.change_count || 0) < 1 &&
              booking.items &&
              booking.items.length > 0 && (
                <Button type="default" disabled={updating}>
                  Đổi phòng
                </Button>
              )}

            {booking.stay_status_id === 1 &&
              booking.payment_status === "paid" && (
                <Button type="primary" loading={updating} disabled={updating}>
                  Check-in
                </Button>
              )}

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
