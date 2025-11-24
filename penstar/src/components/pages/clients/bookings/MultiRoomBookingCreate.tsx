/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
  message,
  Collapse,
  Typography,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { createBooking } from "@/services/bookingsApi";
import useAuth from "@/hooks/useAuth";
import type { RoomSearchParams } from "@/types/room";
import type { RoomBookingConfig } from "@/types/roomBooking";
import type { RoomBookingData } from "@/types/bookings";

const { Panel } = Collapse;
const { TextArea } = Input;
const { Text } = Typography;

import type { AutoAssignRoomConfig } from "@/types/bookingPayload";

const MultiRoomBookingCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const auth = useAuth();
  const user = auth?.user;

  // Dữ liệu từ trang trước
  const selectedRoomIds: number[] = useMemo(
    () => location.state?.selectedRoomIds || [],
    [location.state]
  );
  const autoAssign = location.state?.autoAssign || true;
  console.log("[MultiRoomBookingCreate] location.state:", location.state);
  const roomTypeId =
    location.state?.roomTypeId ??
    (Array.isArray(location.state?.roomsConfig)
      ? location.state.roomsConfig[0]?.room_type_id
      : undefined);
  const roomPrice = location.state?.roomPrice || 0;
  const searchParams: RoomSearchParams = location.state?.searchParams || {};
  const roomsConfig: RoomBookingConfig[] = useMemo(
    () => location.state?.roomsConfig || [],
    [location.state]
  );

  const numRooms = autoAssign ? roomsConfig.length : selectedRoomIds.length;

  const [roomsData, setRoomsData] = useState<RoomBookingData[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [notes, setNotes] = useState("");

  // Mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (res: any) => {
      const bookingId = res?.id || res?.data?.id;
      // KHÔNG hiện thông báo thành công ở đây, chỉ chuyển sang trang thanh toán
      navigate("/bookings/payment-method", {
        state: { bookingId, bookingInfo: res },
      });
    },
    onError: (err: any) => {
      // Log chi tiết lỗi backend trả về
      if (err?.response?.data) {
        console.error("Booking error:", err.response.data);
        message.error(
          err.response.data.message || JSON.stringify(err.response.data)
        );
      } else {
        console.error("Booking error:", err);
        message.error("Đặt phòng thất bại");
      }
    },
  });

  // Auto-fill thông tin khách
  // Sửa lại dependency array để tránh vòng lặp vô hạn
  useEffect(() => {
    if (user) {
      const data = {
        customer_name: user.full_name || "",
        customer_email: user.email || "",
        customer_phone: user.phone || "",
      };
      form.setFieldsValue(data);
      setCustomerInfo(data);
    } else {
      try {
        const saved = localStorage.getItem("penstar_user");
        if (saved) {
          const u = JSON.parse(saved);
          const data = {
            customer_name: u.full_name || "",
            customer_email: u.email || "",
            customer_phone: u.phone || "",
          };
          form.setFieldsValue(data);
          setCustomerInfo(data);
        }
      } catch {
        throw new Error("Failed to parse user data from localStorage");
      }
    }
  }, [user, form]);

  // Khởi tạo roomsData – FIX LỖI LOOP
  useEffect(() => {
    if (autoAssign && roomsConfig.length > 0) {
      setRoomsData(
        roomsConfig.map((cfg) => ({
          room_id: 0,
          room_type_id: cfg.room_type_id,
          num_adults: cfg.num_adults ?? 1,
          num_children: cfg.num_children ?? 0,
          special_requests: "",
          price: cfg.price,
          check_in: searchParams.check_in,
          check_out: searchParams.check_out,
        }))
      );
      return;
    }

    if (selectedRoomIds.length === 0) {
      message.warning("Vui lòng chọn phòng trước");
      navigate(-1);
      return;
    }

    setRoomsData(
      selectedRoomIds.map((id, i) => {
        const cfg = roomsConfig[i] || { num_adults: 1, num_children: 0 };
        return {
          room_id: id,
          num_adults: cfg.num_adults ?? 1,
          num_children: cfg.num_children ?? 0,
          special_requests: "",
          room_type_id: cfg.room_type_id,
          price: cfg.price,
          check_in: searchParams.check_in,
          check_out: searchParams.check_out,
        };
      })
    );
  }, [autoAssign, selectedRoomIds, roomsConfig, navigate]);

  // Tính toán giá – dùng useMemo để tránh re-render loop
  const nights = useMemo(() => {
    if (!searchParams.check_in || !searchParams.check_out) return 1;
    const diff =
      new Date(searchParams.check_out).getTime() -
      new Date(searchParams.check_in).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [searchParams.check_in, searchParams.check_out]);

  const totalRoomPrice = useMemo(() => {
    // Tính tổng giá phòng từ items (payload truyền sang)
    if (Array.isArray(location.state?.items)) {
      return location.state.items.reduce(
        (sum: number, item: any) =>
          sum + Number(item.room_type_price || 0) * nights,
        0
      );
    }
    // Fallback: nếu không có items thì lấy từ roomPrice (autoAssign)
    if (autoAssign) return Number(roomPrice) * numRooms * nights;
    return 0;
  }, [autoAssign, roomPrice, numRooms, nights, location.state]);

  // Bỏ dịch vụ, chỉ lấy tổng tiền phòng
  const totalPrice = totalRoomPrice;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const validateStep = () => {
    if (currentStep === 0) {
      if (!customerInfo.customer_name?.trim())
        return message.error("Vui lòng nhập họ tên");
      if (!customerInfo.customer_phone?.trim())
        return message.error("Vui lòng nhập số điện thoại");
      if (!customerInfo.customer_email?.trim())
        return message.error("Vui lòng nhập email");
    }
    return true;
  };

  const handleNext = () => validateStep() && setCurrentStep((s) => s + 1);
  const handlePrev = () => setCurrentStep((s) => s - 1);

  const handleSubmit = () => {
    console.log("[MultiRoomBookingCreate] Submit button clicked", {
      currentStep,
      autoAssign,
      roomTypeId,
      roomsData,
      customerInfo,
      totalPrice,
      searchParams,
    });
    if (!validateStep()) return;

    const checkin = searchParams.check_in!;
    const checkout = searchParams.check_out!;

    if (autoAssign && roomsConfig.length > 0) {
      // Lấy danh sách loại phòng từ API
      import("@/services/roomTypeApi").then(({ getRoomTypes }) => {
        getRoomTypes().then((roomTypes) => {
          const grouped: Record<string, AutoAssignRoomConfig> = {};
          roomsData.forEach((room) => {
            const roomType = roomTypes.find(
              (rt) => rt.id === room.room_type_id
            );
            const price = roomType ? roomType.price : 0;
            const key = `${room.room_type_id}-${room.num_adults}-${room.num_children}`;
            if (!grouped[key]) {
              grouped[key] = {
                room_type_id: room.room_type_id,
                quantity: 0,
                check_in: checkin,
                check_out: checkout,
                room_type_price: price * nights,
                num_adults: room.num_adults,
                num_children: room.num_children,
              };
            }
            grouped[key].quantity += 1;
          });
          const payload = {
            customer_name: customerInfo.customer_name,
            customer_email: customerInfo.customer_email,
            customer_phone: customerInfo.customer_phone,
            promo_code: searchParams.promo_code || undefined,
            notes: notes || undefined,
            total_price: totalPrice,
            payment_status: "unpaid",
            booking_method: "online",
            stay_status_id: 1,
            rooms_config: Object.values(grouped),
          };
          console.log("[MultiRoomBookingCreate] Payload gửi lên:", payload);
          createBookingMutation.mutate(payload as any);
        });
      });
    }
  };

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center py-4 mb-6 rounded-xl text-white"
          style={{
            background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
          }}
        >
          <h1 className="text-2xl font-bold">Đặt {numRooms} phòng</h1>
          <p className="text-sm opacity-90">
            Hoàn tất thông tin để xác nhận đặt phòng
          </p>
        </div>

        <Card className="shadow-lg rounded-xl">
          <Steps current={currentStep} className="mb-8" size="small">
            <Steps.Step title="Thông tin khách" icon={<UserOutlined />} />
            <Steps.Step title="Chi tiết phòng" icon={<HomeOutlined />} />
            <Steps.Step title="Xác nhận" />
          </Steps>

          {/* Bước 1 */}
          {currentStep === 0 && (
            <Form form={form} layout="vertical">
              <div className="space-y-4">
                <Form.Item label="Họ và tên" required>
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nguyễn Văn A"
                    value={customerInfo.customer_name}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="Số điện thoại" required>
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="0912345678"
                    value={customerInfo.customer_phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_phone: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="Email" required>
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="email@example.com"
                    value={customerInfo.customer_email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_email: e.target.value,
                      })
                    }
                  />
                </Form.Item>
                <Form.Item label="Ghi chú">
                  <TextArea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Item>
              </div>
            </Form>
          )}

          {/* Bước 2 */}
          {currentStep === 1 && (
            <Collapse accordion>
              {Array.isArray(location.state?.items) &&
                location.state.items.map((item: any, idx: number) => {
                  const roomName = item.room_type_name
                    ? `${item.room_type_name} - Phòng ${idx + 1}`
                    : `Phòng ${idx + 1}`;
                  return (
                    <Panel
                      header={
                        <div className="flex justify-between items-center">
                          <Text strong>{roomName}</Text>
                          <Text type="secondary">
                            {formatPrice(item.room_type_price)} / đêm
                          </Text>
                        </div>
                      }
                      key={idx}
                    >
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6 text-center bg-gray-50 p-4 rounded-lg">
                          <div>
                            <div className="text-4xl mb-2">Person</div>
                            <Text type="secondary">Người lớn</Text>
                            <div className="text-3xl font-bold text-blue-600">
                              {item.num_adults}
                            </div>
                          </div>
                          <div>
                            <div className="text-4xl mb-2">Child</div>
                            <Text type="secondary">Trẻ em</Text>
                            <div className="text-3xl font-bold text-blue-600">
                              {item.num_children}
                            </div>
                          </div>
                        </div>
                        {/* ...dịch vụ và yêu cầu đặc biệt giữ nguyên... */}
                      </div>
                    </Panel>
                  );
                })}
            </Collapse>
          )}

          {/* Bước 3 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card title="Thông tin khách hàng">
                <p>
                  <strong>Họ tên:</strong> {customerInfo.customer_name}
                </p>
                <p>
                  <strong>Số điện thoại:</strong> {customerInfo.customer_phone}
                </p>
                <p>
                  <strong>Email:</strong> {customerInfo.customer_email}
                </p>
              </Card>

              <Card title="Thông tin đặt phòng">
                <p>
                  <strong>Check-in:</strong> {searchParams.check_in}
                </p>
                <p>
                  <strong>Check-out:</strong> {searchParams.check_out}
                </p>
                <p>
                  <strong>Số đêm:</strong> {nights} đêm
                </p>
                <p>
                  <strong>Số phòng:</strong> {numRooms} phòng
                </p>
              </Card>

              <Card title={<strong>Tổng chi phí</strong>}>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span>Tiền phòng ({nights} đêm)</span>
                    <strong>{formatPrice(totalRoomPrice)}</strong>
                  </div>
                  <div className="flex justify-between pt-4 border-t-2 border-gray-300">
                    <span className="text-2xl font-bold">TỔNG CỘNG</span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button onClick={handlePrev}>Quay lại</Button>
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={createBookingMutation.isPending}
                onClick={handleSubmit}
                style={{
                  background:
                    "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                }}
              >
                Xác nhận đặt phòng
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MultiRoomBookingCreate;
