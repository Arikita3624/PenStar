/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getBookingById,
  updateBookingStatus,
  confirmCheckout,
  cancelBooking,
} from "@/services/bookingsApi";
import { getRoomID } from "@/services/roomsApi";
import { getServiceById, getServices } from "@/services/servicesApi";
import {
  createBookingService,
  deleteBookingService,
} from "@/services/bookingServicesApi";
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
  DeleteOutlined,
  PrinterOutlined,
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
  const [allServices, setAllServices] = useState<Services[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [addingService, setAddingService] = useState<number | null>(null); // booking_item_id đang thêm dịch vụ
  const [deviceDamageModalVisible, setDeviceDamageModalVisible] =
    useState(false);
  const [deviceDamage, setDeviceDamage] = useState<
    Array<{ device_id: number; device_name: string; description: string }>
  >([]);

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

  const handleCheckIn = async () => {
    if (!booking || !booking.id) return;
    setUpdating(true);
    try {
      await updateBookingStatus(booking.id, { stay_status_id: 2 }); // 2 = checked_in
      message.success(
        "Đã nhận phòng - Trạng thái booking chuyển sang Đã nhận phòng"
      );
      refetch();
    } catch (err) {
      console.error("Lỗi nhận phòng:", err);
      message.error("Lỗi nhận phòng");
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

  const handleAddService = async (bookingItemId: number, serviceId: number) => {
    if (!booking || !booking.id) return;

    // Tìm service để lấy giá
    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      message.error("Không tìm thấy dịch vụ");
      return;
    }

    setAddingService(bookingItemId);
    setUpdating(true);
    try {
      await createBookingService({
        booking_id: booking.id,
        booking_item_id: bookingItemId,
        service_id: serviceId,
        quantity: 1,
        total_service_price: service.price * 1, // Tính giá từ service price
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

  const handleDeleteService = async (bookingServiceId: number) => {
    if (!booking) return;

    Modal.confirm({
      title: "Xác nhận xóa dịch vụ",
      content: "Bạn có chắc muốn xóa dịch vụ này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        setUpdating(true);
        try {
          await deleteBookingService(bookingServiceId);
          message.success("Đã xóa dịch vụ thành công");
          refetch();
        } catch (err) {
          console.error("Lỗi xóa dịch vụ:", err);
          const error = err as { response?: { data?: { message?: string } } };
          message.error(error.response?.data?.message || "Lỗi xóa dịch vụ");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleConfirmCheckout = async () => {
    if (!booking || !booking.id) return;
    // Mở modal để ghi nhận thiết bị hỏng
    setDeviceDamageModalVisible(true);
  };

  const handleConfirmCheckoutWithDamage = async () => {
    if (!booking || !booking.id) return;

    setUpdating(true);
    try {
      // Tạo notes về thiết bị hỏng nếu có
      let damageNotes = "";
      if (deviceDamage.length > 0) {
        damageNotes = `\n[DEVICE_DAMAGE]\n${deviceDamage.map((d) => `- ${d.device_name}: ${d.description}`).join("\n")}`;
      }

      // Cập nhật notes của booking với thông tin thiết bị hỏng
      if (damageNotes) {
        const currentNotes = booking.notes || "";
        await updateBookingStatus(booking.id, {
          notes: currentNotes + damageNotes,
        });
      }

      await confirmCheckout(booking.id!);
      setCheckoutConfirmed(true);
      setDeviceDamageModalVisible(false);
      setDeviceDamage([]);
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

    const groupedServices = booking.services?.reduce(
      (acc: any[], curr: any) => {
        const existing = acc.find(
          (s) =>
            s.service_id === curr.service_id &&
            s.booking_item_id === curr.booking_item_id
        );
        if (existing) {
          existing.quantity = (existing.quantity || 1) + (curr.quantity || 1);
          existing.total_service_price =
            (Number(existing.total_service_price) || 0) +
            (Number(curr.total_service_price) || 0);
        } else {
          acc.push({
            ...curr,
            quantity: curr.quantity || 1,
            total_service_price: Number(curr.total_service_price) || 0,
          });
        }
        return acc;
      },
      []
    );

    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Hóa đơn #${booking.id}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1890ff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1890ff;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
            }
            .text-right {
              text-align: right;
            }
            .total-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #1890ff;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 16px;
            }
            .total-final {
              font-size: 20px;
              font-weight: bold;
              color: #ff4d4f;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PENSTAR HOTEL</h1>
            <p>Hóa đơn thanh toán</p>
            <p>Mã đơn: #${booking.id}</p>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Khách hàng:</span>
              <span class="info-value">${booking.customer_name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày tạo:</span>
              <span class="info-value">${booking.created_at ? formatDate(booking.created_at) : "—"}</span>
            </div>
            ${
              booking.items && booking.items.length > 0
                ? `
            <div class="info-row">
              <span class="info-label">Ngày nhận phòng:</span>
              <span class="info-value">${formatDate(booking.items[0].check_in)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Ngày trả phòng:</span>
              <span class="info-value">${formatDate(booking.items[0].check_out)}</span>
            </div>
            `
                : ""
            }
            <div class="info-row">
              <span class="info-label">Phương thức thanh toán:</span>
              <span class="info-value">${booking.payment_method?.toUpperCase() || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Trạng thái:</span>
              <span class="info-value">${booking.payment_status?.toUpperCase() || "—"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Phòng</th>
                <th class="text-right">Giá</th>
              </tr>
            </thead>
            <tbody>
              ${
                booking.items
                  ?.map((item: any, idx: number) => {
                    const room = rooms.find((r) => r.id === item.room_id);
                    return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${room?.name || `Phòng ${item.room_id}`}</td>
                    <td class="text-right">${formatPrice(item.room_type_price || 0)}</td>
                  </tr>
                `;
                  })
                  .join("") || ""
              }
            </tbody>
          </table>

          ${
            groupedServices && groupedServices.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Dịch vụ</th>
                <th class="text-right">Số lượng</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${groupedServices
                .map((service: any, idx: number) => {
                  const serviceInfo = services.find(
                    (s) => s.id === service.service_id
                  );
                  return `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${serviceInfo?.name || `Dịch vụ #${service.service_id}`}</td>
                    <td class="text-right">${service.quantity || 1}</td>
                    <td class="text-right">${formatPrice(service.total_service_price || 0)}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          `
              : ""
          }

          <div class="total-section">
            <div class="total-row">
              <span>Tiền phòng:</span>
              <span>${formatPrice(booking.total_room_price || 0)}</span>
            </div>
            ${
              booking.total_service_price
                ? `
            <div class="total-row">
              <span>Dịch vụ bổ sung:</span>
              <span>${formatPrice(booking.total_service_price)}</span>
            </div>
            `
                : ""
            }
            ${
              booking.promo_code && booking.discount_amount
                ? `
            <div class="total-row">
              <span>Tổng tiền gốc:</span>
              <span style="text-decoration: line-through; color: #999;">${formatPrice(booking.original_total || booking.total_amount || 0)}</span>
            </div>
            <div class="total-row">
              <span>Mã giảm giá (${booking.promo_code}):</span>
              <span style="color: #52c41a;">-${formatPrice(booking.discount_amount)}</span>
            </div>
            `
                : ""
            }
            <div class="total-row total-final">
              <span>TỔNG CỘNG:</span>
              <span>${formatPrice(booking.total_price || booking.total_amount || 0)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!</p>
            <p>PenStar Hotel - Hotline: 1900-xxxx</p>
          </div>
        </body>
      </html>
    `;

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
              <Tag
                color={booking.booking_method === "online" ? "blue" : "green"}
              >
                {booking.booking_method === "online"
                  ? "📱 Online"
                  : "🏨 Trực tiếp"}
              </Tag>
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
                          {formatPrice(
                            booking.items?.find((it) => it.room_id === room.id)
                              ?.room_price || 0
                          )}
                        </Text>
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
                            <Select
                              placeholder="Thêm dịch vụ"
                              style={{ width: 200 }}
                              size="small"
                              loading={addingService === item.id}
                              onSelect={(serviceId: number | null) => {
                                if (serviceId) {
                                  handleAddService(item.id, serviceId);
                                }
                              }}
                              value={null}
                              disabled={addingService === item.id}
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
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                      onClick={() =>
                                        handleDeleteService(bookingService.id)
                                      }
                                      loading={
                                        updating &&
                                        bookingService.id === bookingService.id
                                      }
                                    />
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
                  onChange={handleUpdatePaymentMethod}
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
                  onChange={handleUpdatePayment}
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
            {booking.promo_code && booking.discount_amount ? (
              <>
                <Divider style={{ margin: "12px 0" }} />
                <Row justify="space-between">
                  <Text>Tổng tiền gốc</Text>
                  <Text
                    style={{ textDecoration: "line-through", color: "#999" }}
                  >
                    {formatPrice(
                      booking.original_total || booking.total_amount || 0
                    )}
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text>
                    Mã giảm giá: <Tag color="green">{booking.promo_code}</Tag>
                  </Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    -{formatPrice(booking.discount_amount)}
                  </Text>
                </Row>
              </>
            ) : null}
            <Divider style={{ margin: "12px 0" }} />
            <Row justify="space-between">
              <Title level={4} style={{ margin: 0 }}>
                Tổng cộng
              </Title>
              <Title level={4} type="danger" style={{ margin: 0 }}>
                {formatPrice(booking.total_price || booking.total_amount || 0)}
              </Title>
            </Row>
          </Space>
        </Card>

        {/* Action Buttons */}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
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
          </Space>
        </div>

        {/* Modal ghi nhận thiết bị hỏng */}
        <Modal
          title="Xác nhận checkout và ghi nhận thiết bị hỏng"
          open={deviceDamageModalVisible}
          onOk={handleConfirmCheckoutWithDamage}
          onCancel={() => {
            setDeviceDamageModalVisible(false);
            setDeviceDamage([]);
          }}
          okText="Xác nhận checkout"
          cancelText="Hủy"
          width={600}
        >
          <div>
            <Text>
              Xác nhận khách đã checkout? Phòng sẽ chuyển sang trạng thái
              Cleaning.
            </Text>
            <Divider />
            <Title level={5}>Thiết bị hỏng (nếu có)</Title>
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginBottom: 12 }}
            >
              Ghi nhận các thiết bị bị hỏng trong phòng khi khách checkout
            </Text>
            {deviceDamage.map((damage, index) => (
              <Card key={index} size="small" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Text strong>{damage.device_name}</Text>
                    <Button
                      danger
                      size="small"
                      onClick={() => {
                        const newDamage = deviceDamage.filter(
                          (_, i) => i !== index
                        );
                        setDeviceDamage(newDamage);
                      }}
                      style={{ float: "right" }}
                    >
                      Xóa
                    </Button>
                  </div>
                  <Text>{damage.description}</Text>
                </Space>
              </Card>
            ))}
            <Button
              type="dashed"
              onClick={() => {
                const deviceName = prompt("Tên thiết bị:");
                if (deviceName) {
                  const description = prompt("Mô tả tình trạng hỏng:");
                  if (description) {
                    setDeviceDamage([
                      ...deviceDamage,
                      {
                        device_id: deviceDamage.length + 1,
                        device_name: deviceName,
                        description: description,
                      },
                    ]);
                  }
                }
              }}
              block
              style={{ marginTop: 8 }}
            >
              + Thêm thiết bị hỏng
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default BookingDetail;
