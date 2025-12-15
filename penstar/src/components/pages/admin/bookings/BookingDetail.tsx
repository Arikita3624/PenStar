import { generateBillHTML } from "@/utils/generateBillHTML";
import { markNoShow } from "@/services/bookingsApi";
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  confirmCheckin,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById, getServices } from "@/services/servicesApi";
import { createBookingService } from "@/services/bookingServicesApi";
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
  HomeOutlined,
  DollarOutlined,
  TagOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const BookingDetail = () => {
  // State để lưu số lượng dịch vụ khi thêm
  const { id } = useParams();
  const navigate = useNavigate();

  const [noShowLoading, setNoShowLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Services[]>([]);
  const [allServices, setAllServices] = useState<Services[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [addingService, setAddingService] = useState<number | null>(null);

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

  // Điều kiện hiển thị nút No Show: admin, booking chưa bị hủy, chưa no show, chưa check-in/out
  // Validate điều kiện no show ở frontend
  let canMarkNoShow = false;
  if (booking) {
    if (booking.stay_status_id === 4) {
      // ...
    } else if (booking.stay_status_id === 5) {
      // ...
    } else if (booking.stay_status_id === 2 || booking.stay_status_id === 3) {
      // ...
    } else if (booking.stay_status_id === 6) {
      // ...
    } else if (booking.check_in) {
      // Kiểm tra thời gian check-in (sau 2 tiếng kể từ 12:00 ngày nhận phòng)
      const now = new Date();
      const checkInDate = new Date(booking.check_in);
      checkInDate.setHours(12 + 2, 0, 0, 0); // 14:00 (2 tiếng sau 12:00)
      if (now >= checkInDate) {
        canMarkNoShow = true;
      }
    } else {
      // ...
    }
  }

  const handleNoShow = async () => {
    if (!booking || !booking.id) return;
    Modal.confirm({
      title: "Xác nhận No Show",
      content: "Bạn có chắc chắn muốn đánh dấu booking này là No Show?",
      okText: "Xác nhận No Show",
      cancelText: "Hủy",
      onOk: async () => {
        setNoShowLoading(true);
        try {
          await markNoShow(booking.id!);
          message.success("Đã đánh dấu No Show thành công.");
          refetch();
        } catch (err) {
          console.error("Lỗi No Show:", err);
          const error = err as { response?: { data?: { message?: string } } };
          message.error(error.response?.data?.message || "Lỗi No Show");
        } finally {
          setNoShowLoading(false);
        }
      },
    });
  };

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

        // Don't use Set - we need all room instances even if same room_id
        const uniqueServiceIds = Array.from(new Set(serviceIds));

        // Load all services for adding new ones
        const allServicesData = await getServices();

        const [roomResults, serviceResults] = await Promise.all([
          Promise.all(roomIds.map(getRoomID)), // Fetch all rooms including duplicates
          Promise.all(uniqueServiceIds.map(getServiceById)),
        ]);

        if (mounted) {
          setRooms(roomResults.filter(Boolean) as Room[]);
          setServices(serviceResults.filter(Boolean) as Services[]);
          setAllServices(allServicesData);

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

  const handleApprove = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      // Nếu thanh toán tiền mặt thì khi duyệt sẽ tự động coi là đã thanh toán thành công
      if (booking.payment_method === "cash") {
        await updateBookingStatus(booking.id, {
          stay_status_id: 1,
          payment_status: "paid",
        });
        message.success("Đã duyệt booking & thanh toán tiền mặt thành công");
      } else {
        await updateBookingStatus(booking.id, { stay_status_id: 1 });
        message.success(
          "Đã duyệt booking - Phòng chuyển sang trạng thái Booked"
        );
      }
      refetch();
    } catch (err) {
      console.error("Lỗi duyệt booking:", err);
      message.error("Lỗi duyệt booking");
    } finally {
      setUpdating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await confirmCheckin(booking.id);
      message.success(
        "Đã nhận phòng - Trạng thái booking chuyển sang Đã nhận phòng và đã lưu người check-in"
      );
      refetch();
    } catch (err: any) {
      console.error("Lỗi nhận phòng:", err);
      // Hiển thị message chi tiết từ backend nếu có
      const backendMsg = err?.response?.data?.message;
      message.error(backendMsg || "Lỗi nhận phòng");
    } finally {
      setUpdating(false);
    }
  };
  const handleCancel = async () => {
    if (!booking || !booking.id) return;
    let reason = "";
    Modal.confirm({
      title: "Xác nhận hủy",
      content: (
        <div>
          <div>
            Bạn có chắc muốn hủy booking này? Phòng sẽ trở về trạng thái
            Available. Trạng thái thanh toán sẽ tự động chuyển thành Failed.
          </div>
          <div style={{ marginTop: 12 }}>
            <b>Lý do hủy:</b>
            <textarea
              style={{ width: "100%", minHeight: 60, marginTop: 4 }}
              onChange={(e) => (reason = e.target.value)}
              placeholder="Nhập lý do hủy..."
            />
          </div>
        </div>
      ),
      onOk: async () => {
        setUpdating(true);
        try {
          await cancelBooking(booking.id!, reason);
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

  // Chỉ cho phép thêm/xóa dịch vụ khi booking ở trạng thái hợp lệ
  const canModifyService = booking && Number(booking.stay_status_id) === 2;

  const handleAddService = async (
    bookingItemId: number,
    serviceId: number,
    quantity: number = 1
  ) => {
    if (!booking || !booking.id || !canModifyService) {
      message.warning(
        "Chỉ có thể thêm dịch vụ khi booking ở trạng thái Đã xác nhận hoặc Đang ở!"
      );
      return;
    }
    // Tìm service để lấy giá
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      message.error("Không tìm thấy dịch vụ");
      return;
    }
    // Hỏi note khi thêm dịch vụ
    let note = "";
    note =
      window.prompt("Ghi chú cho thao tác thêm dịch vụ (nếu có):", "") || "";
    setAddingService(bookingItemId);
    setUpdating(true);
    try {
      await createBookingService({
        booking_id: booking.id,
        booking_item_id: bookingItemId,
        service_id: serviceId,
        quantity: quantity,
        total_service_price: service.price * quantity,
        note: note || undefined,
      });
      message.success("Đã thêm dịch vụ thành công");
      refetch();
    } catch (err) {
      console.error("Lỗi thêm dịch vụ:", err);
      const error = err as { response?: { data?: { message?: string } } };
      message.error(error.response?.data?.message || "Lỗi thêm dịch vụ");
    } finally {
      setAddingService(null);
      setUpdating(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!booking || !booking.id) return;
    // Validate: chỉ cho phép checkout sau 12h trưa ngày check-out
    if (booking.check_out) {
      const now = new Date();
      const checkoutDate = new Date(booking.check_out);
      checkoutDate.setHours(12, 0, 0, 0); // 12:00 trưa ngày check-out
      if (now < checkoutDate) {
        message.warning("Chỉ được phép checkout sau 12h trưa ngày check-out!");
        return;
      }
    }
    setUpdating(true);
    try {
      // Gọi API cập nhật trạng thái booking sang đã checkout (stay_status_id = 3)
      await updateBookingStatus(booking.id, { stay_status_id: 3 });
      message.success("Đã xác nhận checkout thành công!");
      setCheckoutConfirmed(true);
      refetch();
    } catch (err) {
      console.error("Lỗi xác nhận checkout:", err);
      message.error("Lỗi xác nhận checkout");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintBill = () => {
    if (!booking) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error(
        "Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt."
      );
      return;
    }
    const billHTML = generateBillHTML(
      booking,
      rooms,
      services,
      formatDate,
      formatPrice
    );
    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
        {/* Booking ID only, no status/payment tag, no Tag PAID */}
        <Card style={{ marginBottom: 16 }}>
          <Row>
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
        </Card>

        {/* Customer Info + Người check-in/out */}
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
              <Tag
                color={booking.booking_method === "online" ? "blue" : "green"}
              >
                {booking.booking_method === "online"
                  ? "📱 Online"
                  : "🏨 Trực tiếp"}
              </Tag>
            </Col>
          </Row>
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Người check-in</Text>
              <br />
              <Text>
                {booking.checked_in_by_email || (
                  <span style={{ color: "#aaa" }}>Chưa check-in</span>
                )}
              </Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Người check-out</Text>
              <br />
              <Text>
                {booking.checked_out_by_email || (
                  <span style={{ color: "#aaa" }}>Chưa check-out</span>
                )}
              </Text>
            </Col>
          </Row>
        </Card>
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

                // Các trường extra
                const extraAdultFees = item.extra_adult_fees || 0;
                const extraChildFees = item.extra_child_fees || 0;
                const extraFees = item.extra_fees || 0;
                const quantity = item.quantity || 1;
                const numBabies = item.num_babies || 0;

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
                                  : ""}
                                {numBabies > 0 ? `, ${numBabies} em bé` : ""}
                                (Tổng: {totalGuests + numBabies} khách)
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
                              {/* Hiển thị các trường extra */}
                              {(extraAdultFees > 0 ||
                                extraChildFees > 0 ||
                                extraFees > 0) && (
                                <div style={{ marginTop: 8 }}>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    <strong>Phụ phí:</strong>
                                  </Text>
                                  {extraAdultFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Người lớn: {formatPrice(extraAdultFees)}
                                    </Text>
                                  )}
                                  {extraChildFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Trẻ em: {formatPrice(extraChildFees)}
                                    </Text>
                                  )}
                                  {extraFees > 0 && (
                                    <Text
                                      type="danger"
                                      style={{ fontSize: 12, marginLeft: 8 }}
                                    >
                                      Tổng phụ phí: {formatPrice(extraFees)}
                                    </Text>
                                  )}
                                </div>
                              )}
                              {quantity > 1 && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Số lượng phòng: {quantity}
                                </Text>
                              )}
                            </Space>
                          </div>
                        </div>
                        {/* Đã xóa giá phòng góc phải */}
                      </div>

                      {/* Services for this room */}
                      <div
                        style={{
                          marginTop: 12,
                          marginLeft: 80,
                          paddingLeft: 12,
                          borderLeft: "2px solid #f0f0f0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                            }}
                          >
                            <TagOutlined /> Dịch vụ bổ sung (
                            {roomServices.length}):
                          </Text>
                          <Space>
                            {/* Đã ẩn InputNumber chỉnh số lượng dịch vụ */}
                            <Select
                              placeholder="Thêm dịch vụ"
                              style={{ width: 200 }}
                              size="small"
                              loading={addingService === item.id}
                              onSelect={(serviceId: number | null) => {
                                if (serviceId) {
                                  handleAddService(item.id, serviceId, 1);
                                }
                              }}
                              value={null}
                              disabled={
                                addingService === item.id || !canModifyService
                              }
                            >
                              {allServices
                                .filter(
                                  (s) =>
                                    !roomServices.some(
                                      (rs: any) => rs.service_id === s.id
                                    )
                                )
                                .map((s) => (
                                  <Select.Option key={s.id} value={s.id}>
                                    {s.name} - {formatPrice(s.price)}
                                  </Select.Option>
                                ))}
                            </Select>
                          </Space>
                        </div>
                        {roomServices.length > 0 ? (
                          roomServices.map(
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
                                    alignItems: "center",
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
                                  <Space>
                                    <Text
                                      style={{ fontSize: 13, color: "#ff4d4f" }}
                                    >
                                      {formatPrice(
                                        bookingService.total_service_price || 0
                                      )}
                                    </Text>
                                  </Space>
                                </div>
                              );
                            }
                          )
                        ) : (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Chưa có dịch vụ nào
                          </Text>
                        )}
                      </div>
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
              ) : booking.booking_method === "offline" &&
                booking.stay_status_id === 1 &&
                booking.payment_status !== "paid" ? (
                // Cho phép sửa khi: offline booking, đã duyệt, chưa thanh toán
                <Select
                  value={booking.payment_method || undefined}
                  placeholder="Chọn phương thức"
                  style={{ width: 220 }}
                  disabled={updating}
                  allowClear
                  options={[
                    {
                      label: "💵 Tiền mặt",
                      value: "cash",
                    },
                    {
                      label: " Ví MoMo",
                      value: "momo",
                    },
                    {
                      label: "💰 VNPAY",
                      value: "vnpay",
                    },
                  ]}
                />
              ) : (
                // Tất cả các trường hợp khác - chỉ xem
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
            {booking.booking_method === "offline" &&
              booking.stay_status_id === 1 &&
              booking.payment_status !== "paid" && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  💡 Chọn phương thức thanh toán trực tiếp tại quầy lễ tân (tiền
                  mặt, thẻ, chuyển khoản, v.v.)
                </Text>
              )}
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
              ) : booking.stay_status_id === 1 &&
                booking.payment_status !== "paid" ? (
                // Chỉ cho phép sửa khi: đã duyệt (stay_status_id === 1) VÀ chưa thanh toán
                <Select
                  value={booking.payment_status}
                  style={{ width: 200 }}
                  disabled={updating}
                  options={
                    booking.booking_method === "online"
                      ? [
                          // Online booking - chỉ unpaid/paid/failed
                          {
                            label: "Unpaid (Chưa thanh toán)",
                            value: "unpaid",
                          },
                          {
                            label: "Paid (Đã thanh toán - Online)",
                            value: "paid",
                          },
                          { label: "Failed (Thất bại)", value: "failed" },
                        ]
                      : [
                          // Offline booking - có thêm pending (chờ thanh toán COD)
                          {
                            label: "Unpaid (Chưa thanh toán)",
                            value: "unpaid",
                          },
                          {
                            label: "Pending (Chờ thanh toán COD)",
                            value: "pending",
                          },
                          {
                            label: "Paid (Đã thanh toán - Tiền mặt)",
                            value: "paid",
                          },
                          { label: "Failed (Thất bại)", value: "failed" },
                        ]
                  }
                />
              ) : (
                // Tất cả các trường hợp khác - chỉ xem, không sửa
                <Tag
                  color={
                    booking.payment_status === "paid"
                      ? "green"
                      : booking.payment_status === "unpaid"
                        ? "orange"
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
            {(booking.stay_status_id === 4 || booking.stay_status_id === 5) && (
              <>
                <Text type="warning" style={{ fontSize: 12 }}>
                  {booking.stay_status_id === 4
                    ? "⚠️ Booking đã hủy. Trạng thái thanh toán = Failed (không thể sửa)."
                    : "⚠️ Booking No show. Trạng thái thanh toán = Failed (không thể sửa)."}
                </Text>
                {booking.cancel_reason && (
                  <div style={{ margin: "8px 0" }}>
                    <Text strong>Lý do hủy:</Text>{" "}
                    <Text>{booking.cancel_reason}</Text>
                  </div>
                )}
                {booking.canceled_by && (
                  <div style={{ margin: "4px 0" }}>
                    <Text strong>Người hủy:</Text>{" "}
                    <Text>
                      {booking.canceled_by_name
                        ? booking.canceled_by_name
                        : `ID: ${booking.canceled_by}`}
                    </Text>
                  </div>
                )}
                {booking.canceled_at && (
                  <div style={{ margin: "4px 0" }}>
                    <Text strong>Thời điểm hủy:</Text>{" "}
                    <Text>
                      {new Date(booking.canceled_at).toLocaleString("vi-VN")}
                    </Text>
                  </div>
                )}
                {/* Ẩn nút hoàn tiền khi hủy hoặc no show */}
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
            {/* Đã loại bỏ logic hiển thị giảm giá, mã giảm giá */}
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                Tổng cộng
              </Title>
              <Title level={4} type="danger" style={{ margin: 0 }}>
                {formatPrice(booking.total_price || 0)}
              </Title>
            </Row>
          </Space>
        </Card>

        {/* Action Buttons */}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
            {/* Ẩn toàn bộ action button nếu đã hủy hoặc no show */}
            {booking.stay_status_id !== 4 && booking.stay_status_id !== 5 && (
              <>
                {booking.stay_status_id === 1 && (
                  <Button
                    type="primary"
                    onClick={handleCheckIn}
                    loading={updating}
                    disabled={updating}
                  >
                    Check In
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
                {/* Hiện nút Hủy khi booking chưa bị hủy, chưa check-in, chưa check-out */}
                {booking.stay_status_id !== 4 &&
                  booking.stay_status_id !== 2 &&
                  booking.stay_status_id !== 3 && (
                    <Button
                      danger
                      onClick={handleCancel}
                      loading={updating}
                      disabled={updating}
                    >
                      Hủy
                    </Button>
                  )}
                {/* Nút No Show cho admin */}
                <Button
                  danger
                  type="dashed"
                  onClick={handleNoShow}
                  loading={noShowLoading}
                  disabled={!canMarkNoShow || noShowLoading || updating}
                >
                  No Show
                </Button>
                {/* Hiện nút Xác nhận checkout khi khách đã checkout (stay_status_id === 2 = checked_out) VÀ chưa confirm */}
                {booking.stay_status_id === 2 && !checkoutConfirmed && (
                  <Button
                    type="primary"
                    onClick={handleConfirmCheckout}
                    loading={updating}
                    disabled={updating}
                  >
                    Xác nhận checkout
                  </Button>
                )}
                {/* Hiện nút In hóa đơn khi đã thanh toán (có thể in bất cứ lúc nào sau khi thanh toán) */}
                {booking.payment_status === "paid" && (
                  <Button
                    type="default"
                    icon={<PrinterOutlined />}
                    onClick={handlePrintBill}
                  >
                    In hóa đơn
                  </Button>
                )}
              </>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
