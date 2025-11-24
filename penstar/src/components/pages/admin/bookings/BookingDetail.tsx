/* eslint-disable @typescript-eslint/no-explicit-any */

import { getRoomID } from "@/services/roomsApi";
import type { BookingDetails } from "@/types/bookings";
import type { RoomType } from "@/types/roomtypes";
import type { Room } from "@/types/room";
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
} from "@ant-design/icons";
import { getRoomTypeById } from "@/services/roomTypeApi";
import {
  updateBookingStatus,
  getBookingById,
  confirmCheckout,
} from "@/services/bookingsApi";

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
  const [roomTypes, setRoomTypes] = useState<Record<number, RoomType>>({});
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ==================== HANDLE CHECKIN ====================
  const handleCheckin = async () => {
    if (!booking?.id) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, { stay_status_id: 2 });
      message.success("Đã check-in thành công!");
      refetch();
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setUpdating(false);
    }
  };

  // ==================== HANDLE CHECKOUT ====================
  const handleConfirmCheckout = async () => {
    if (!booking?.id) return;
    Modal.confirm({
      title: "Xác nhận checkout",
      content: "Xác nhận khách đã trả phòng và thanh toán đầy đủ?",
      onOk: async () => {
        setUpdating(true);
        try {
          await confirmCheckout(Number(booking.id));
          message.success("Đã checkout thành công!");
          refetch();
        } catch (err) {
          message.error("Lỗi checkout");
          console.error(err);
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  // ==================== UTILS ====================
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

  // ==================== LOAD EXTRAS ====================
  useEffect(() => {
    let mounted = true;
    const loadExtras = async () => {
      if (!booking) return;
      setLoadingExtras(true);
      try {
        const roomIds: string[] = [];
        const roomTypeIds: number[] = [];
        if (Array.isArray(booking.items)) {
          booking.items.forEach((it: any) => {
            if (it.room_id) roomIds.push(String(it.room_id));
            if (it.room_type_id) roomTypeIds.push(Number(it.room_type_id));
          });
        }
        const uniqueRoomTypeIds = Array.from(new Set(roomTypeIds));
        const [roomResults, roomTypeResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)),
          Promise.all(uniqueRoomTypeIds.map(getRoomTypeById)),
        ]);
        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          const roomTypeMap: Record<number, RoomType> = {};
          roomTypeResults.forEach((rt) => {
            if (rt && rt.id) roomTypeMap[rt.id] = rt;
          });
          setRoomTypes(roomTypeMap);
        }
      } catch (err) {
        message.error("Lỗi tải thông tin phòng/loại phòng");
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

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  if (isError || !booking)
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

  return (
    <div
      style={{
        padding: "24px",
        background: "#f5f5f5",
        minHeight: "100vh",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
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
        style={{ marginBottom: 20 }}
      >
        <Row gutter={32}>
          <Col span={12}>
            <Text type="secondary">Họ tên</Text>
            <div>
              <Text strong>{booking.customer_name || "—"}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary">
              <MailOutlined /> Email
            </Text>
            <div>
              <Text>{booking.email || "—"}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary">
              <PhoneOutlined /> Số điện thoại
            </Text>
            <div>
              <Text>{booking.phone || "—"}</Text>
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary">Phương thức đặt phòng</Text>
            <div>
              <Tag color="blue">Online</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {booking.notes && (
        <Card title="Ghi chú từ khách hàng" style={{ marginBottom: 16 }}>
          <Text style={{ fontStyle: "italic", color: "#595959" }}>
            {booking.notes}
          </Text>
        </Card>
      )}

      {/* Rooms */}
      <Card
        className="mb-8 rounded-xl shadow-sm"
        title={
          <Space className="text-base">
            <HomeOutlined className="text-blue-600" /> Phòng đã đặt (
            {booking.items?.length || 0} phòng)
          </Space>
        }
        loading={loadingExtras}
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
              const typeId = String(
                item.room_type_id ?? room.type_id ?? "unknown"
              );
              const roomType =
                roomTypes[item.room_type_id] || roomTypes[room.type_id];
              const typeName =
                roomType?.name ||
                room.room_type_name?.trim() ||
                item.room_type_name?.trim() ||
                `Loại phòng ${typeId}`;
              const typePrice =
                item.room_type_price ??
                roomType?.price ??
                room.room_type_price ??
                0;
              if (!grouped[typeId])
                grouped[typeId] = { typeName, typePrice, rooms: [] };
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
                    return (
                      <div
                        key={i}
                        className="flex gap-5 items-start bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <Image
                          src={room.thumbnail || "/placeholder.jpg"}
                          width={90}
                          height={90}
                          alt={room.name}
                          className="rounded-lg object-cover shadow-sm"
                          fallback="/placeholder-room.jpg"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 m-0">
                            {room.name || `Phòng ${room.id}`}
                          </h3>
                          <div className="mt-2 text-gray-600">
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

      {/* TỔNG KẾT THANH TOÁN + NÚT CHECK-IN/CHECK-OUT ĐẶT Ở DƯỚI CÙNG */}
      <Card
        title={
          <Space>
            <DollarOutlined /> Tổng kết thanh toán
          </Space>
        }
        style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
      >
        <div style={{ padding: "12px 0" }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
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
            >
              {booking.payment_method?.toUpperCase() || "—"}
            </Tag>
          </Row>

          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15 }}>
              Trạng thái thanh toán
            </Text>
            <Tag
              color={booking.payment_status === "paid" ? "green" : "default"}
            >
              {booking.payment_status?.toUpperCase() || "—"}
            </Tag>
          </Row>

          <Divider style={{ margin: "24px 0" }} />

          {Number(booking.total_room_price || 0) > 0 && (
            <Row justify="space-between" style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15 }}>Tiền phòng</Text>
              <Text strong style={{ fontSize: 18 }}>
                {formatPrice(booking.total_room_price || 0)}
              </Text>
            </Row>
          )}

          {Number(booking.total_service_price || 0) > 0 && (
            <Row justify="space-between" style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 15 }}>Dịch vụ bổ sung</Text>
              <Text strong style={{ fontSize: 18 }}>
                {formatPrice(booking.total_service_price ?? 0)}
              </Text>
            </Row>
          )}

          <Divider style={{ margin: "24px 0" }} />

          <Row justify="space-between" style={{ marginBottom: 24 }}>
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

          {/* NÚT HÀNH ĐỘNG – ĐÚNG VỊ TRÍ DƯỚI "TỔNG CỘNG" */}
          <div
            style={{
              textAlign: "right",
              paddingTop: 16,
              borderTop: "1px solid #f0f0f0",
              marginTop: 16,
            }}
          >
            <Space size="middle" align="center">
              {/* NÚT HỦY BOOKING – CHỈ HIỆN KHI CHƯA CHECK-IN & CHƯA BỊ HỦY */}
              {[1, null, undefined].includes(booking.stay_status_id) &&
                booking.status?.toLowerCase() !== "cancelled" && (
                  <Button
                    danger
                    size="large"
                    loading={updating}
                    disabled={updating}
                  >
                    Hủy booking
                  </Button>
                )}

              {/* CHECK-IN */}
              {booking.stay_status_id === 1 && (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCheckin}
                  loading={updating}
                  disabled={updating}
                >
                  Check-in
                </Button>
              )}

              {/* CHECK-OUT */}
              {booking.stay_status_id === 2 && (
                <Button
                  type="primary"
                  danger
                  size="large"
                  onClick={handleConfirmCheckout}
                  loading={updating}
                  disabled={updating}
                >
                  Check-out
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingDetail;
