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
  Select,
  Collapse,
  Typography,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getServices } from "@/services/servicesApi";
import { createBooking } from "@/services/bookingsApi";
import useAuth from "@/hooks/useAuth";
import type { RoomSearchParams } from "@/types/room";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import type { RoomBookingConfig } from "@/types/roomBooking";
import type { RoomBookingData } from "@/types/bookings";

const { Panel } = Collapse;
const { TextArea } = Input;
const { Text } = Typography;

type AutoAssignRoomConfig = {
  room_type_id: number;
  quantity: number;
  check_in: string;
  check_out: string;
  room_type_price: number;
  num_adults: number;
  num_children: number;
};

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
  const autoAssign = location.state?.autoAssign || false;
  const roomTypeId = location.state?.roomTypeId;
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

  // Fetch rooms & services
  const { data: fetchedRooms = [] } = useQuery<Room[]>({
    queryKey: ["multiRoomDetails", selectedRoomIds],
    queryFn: async () => {
      const promises = selectedRoomIds.map((id) => getRoomID(id));
      return Promise.all(promises);
    },
    enabled: selectedRoomIds.length > 0 && !autoAssign,
  });

  const { data: services = [] } = useQuery<Services[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  // Mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (res: any) => {
      const bookingId = res?.id || res?.data?.id;
      message.success("Đặt phòng thành công!");
      navigate("/bookings/payment-method", {
        state: { bookingId, bookingInfo: res },
      });
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Đặt phòng thất bại");
    },
  });

  // Auto-fill thông tin khách
  // Sửa lại dependency array để tránh vòng lặp vô hạn
  useEffect(() => {
    if (user) {
      const data = {
        customer_name: user.full_name || user.name || "",
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
      } catch {}
    }
  }, [user, form]);

  // Khởi tạo roomsData – FIX LỖI LOOP
  useEffect(() => {
    if (autoAssign && roomsConfig.length > 0) {
      setRoomsData(
        roomsConfig.map((cfg) => ({
          room_id: 0,
          num_adults: cfg.num_adults ?? 1,
          num_children: cfg.num_children ?? 0,
          special_requests: cfg.special_requests || "",
          service_ids: Array.isArray(cfg.service_ids) ? cfg.service_ids : [],
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
          service_ids: Array.isArray(cfg.service_ids) ? cfg.service_ids : [],
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
    if (autoAssign) return Number(roomPrice) * numRooms * nights;
    return (
      fetchedRooms.reduce((sum, room) => sum + Number(room?.price || 0), 0) *
      nights
    );
  }, [autoAssign, roomPrice, numRooms, nights, fetchedRooms]);

  const totalServicePrice = useMemo(() => {
    return roomsData.reduce((sum, room) => {
      return (
        sum +
        (room.service_ids || []).reduce((acc, id) => {
          const svc = services.find((s) => s.id === id);
          return acc + Number(svc?.price || 0);
        }, 0)
      );
    }, 0);
  }, [roomsData, services]);

  const totalPrice = totalRoomPrice + totalServicePrice;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleRoomDataChange = (
    index: number,
    field: keyof RoomBookingData,
    value: any
  ) => {
    setRoomsData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

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
    if (!validateStep()) return;

    const checkin = searchParams.check_in!;
    const checkout = searchParams.check_out!;

    if (autoAssign && roomTypeId) {
      const grouped: Record<string, AutoAssignRoomConfig> = {};
      roomsData.forEach((room) => {
        const key = `${room.num_adults}-${room.num_children}`;
        if (!grouped[key]) {
          grouped[key] = {
            room_type_id: roomTypeId,
            quantity: 0,
            check_in: checkin,
            check_out: checkout,
            room_type_price: Number(roomPrice) * nights,
            num_adults: room.num_adults,
            num_children: room.num_children,
          };
        }
        grouped[key].quantity += 1;
      });

      const services_data = roomsData.flatMap((room) =>
        (room.service_ids || []).map((id) => ({
          service_id: id,
          quantity: 1,
          total_service_price: Number(
            services.find((s) => s.id === id)?.price || 0
          ),
        }))
      );

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
        ...(services_data.length > 0 ? { services: services_data } : {}),
      };

      createBookingMutation.mutate(payload as any);
      return;
    }

    // Old mode
    const items = roomsData.map((d, i) => ({
      room_id: d.room_id,
      check_in: checkin,
      check_out: checkout,
      room_price: Number(fetchedRooms[i]?.price || 0) * nights,
      num_adults: d.num_adults,
      num_children: d.num_children,
    }));

    const services_data = roomsData.flatMap((room) =>
      (room.service_ids || []).map((id) => ({
        service_id: id,
        quantity: 1,
        total_service_price: Number(
          services.find((s) => s.id === id)?.price || 0
        ),
      }))
    );

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
      items,
      ...(services_data.length > 0 ? { services: services_data } : {}),
    };

    createBookingMutation.mutate(payload as any);
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
              {roomsData.map((roomData, idx) => {
                const room = fetchedRooms[idx];
                const roomName = autoAssign
                  ? `Phòng ${idx + 1} (Tự động)`
                  : room?.name || `Phòng ${idx + 1}`;

                return (
                  <Panel
                    header={
                      <div className="flex justify-between items-center">
                        <Text strong>{roomName}</Text>
                        {!autoAssign && room && (
                          <Text type="secondary">
                            {formatPrice(room.price)} / đêm
                          </Text>
                        )}
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
                            {roomData.num_adults}
                          </div>
                        </div>
                        <div>
                          <div className="text-4xl mb-2">Child</div>
                          <Text type="secondary">Trẻ em</Text>
                          <div className="text-3xl font-bold text-blue-600">
                            {roomData.num_children}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Text strong>Dịch vụ bổ sung</Text>
                        <Select
                          mode="tags"
                          allowClear
                          className="w-full mt-2"
                          placeholder="Chọn dịch vụ"
                          value={roomData.service_ids || []}
                          onChange={(val) => {
                            console.log("Chọn dịch vụ:", val);
                            // Đảm bảo kiểu dữ liệu là number[]
                            const ids = Array.isArray(val)
                              ? val.map(Number)
                              : [];
                            setRoomsData((prev) =>
                              prev.map((room, i) =>
                                i === idx ? { ...room, service_ids: ids } : room
                              )
                            );
                          }}
                          style={{ width: "100%" }}
                        >
                          {services.map((svc) => (
                            <Select.Option key={svc.id} value={svc.id}>
                              {svc.name} - {Number(svc.price).toLocaleString()}{" "}
                              đ
                            </Select.Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <Text strong>Yêu cầu đặc biệt</Text>
                        <TextArea
                          rows={3}
                          placeholder="Giường phụ, view biển..."
                          value={roomData.special_requests}
                          onChange={(e) =>
                            handleRoomDataChange(
                              idx,
                              "special_requests",
                              e.target.value
                            )
                          }
                        />
                      </div>
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
                  {totalServicePrice > 0 && (
                    <div className="flex justify-between">
                      <span>Dịch vụ bổ sung</span>
                      <strong>{formatPrice(totalServicePrice)}</strong>
                    </div>
                  )}
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
            <Button onClick={handlePrev} disabled={currentStep === 0}>
              Quay lại
            </Button>
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
