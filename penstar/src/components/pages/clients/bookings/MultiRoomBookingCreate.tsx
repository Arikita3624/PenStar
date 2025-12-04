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
  Checkbox,
  InputNumber,
  Divider,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services/servicesApi";
import useAuth from "@/hooks/useAuth";
import type { RoomSearchParams } from "@/types/room";
import type { RoomBookingConfig } from "@/types/roomBooking";
import type { RoomBookingData } from "@/types/bookings";
import type { Services } from "@/types/services";

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

  // Load danh sách dịch vụ
  const { data: services = [], isLoading: servicesLoading } = useQuery<
    Services[]
  >({
    queryKey: ["services"],
    queryFn: getServices,
  });

  // State để lưu dịch vụ đã chọn theo từng phòng: roomServices[roomIndex][serviceId] = quantity
  const [roomServices, setRoomServices] = useState<
    Record<number, Record<number, number>>
  >({});

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
        roomsConfig.map((cfg: any) => ({
          room_id: 0,
          room_type_id: cfg.room_type_id,
          num_adults: cfg.num_adults ?? 1,
          num_children: cfg.num_children ?? 0,
          special_requests: "",
          price: cfg.room_type_price || cfg.price || 0,
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
      // room_type_price trong items từ RoomBookingModal đã là tổng (đã nhân với số đêm)
      // Không cần nhân thêm với nights nữa
      return location.state.items.reduce(
        (sum: number, item: any) => {
          // room_type_price đã là tổng giá cho cả kỳ nghỉ
          return sum + Number(item.room_type_price || 0);
        },
        0
      );
    }
    // Fallback: nếu không có items thì lấy từ roomPrice (autoAssign)
    // roomPrice là giá mỗi đêm, cần nhân với số phòng và số đêm
    if (autoAssign) return Number(roomPrice) * numRooms * nights;
    return 0;
  }, [autoAssign, roomPrice, numRooms, nights, location.state]);

  // Tính tổng giá dịch vụ từ tất cả các phòng
  const totalServicePrice = useMemo(() => {
    let sum = 0;
    Object.values(roomServices).forEach((roomServiceMap) => {
      Object.entries(roomServiceMap).forEach(([serviceId, quantity]) => {
        const service = services.find((s) => s.id === Number(serviceId));
        if (service && quantity > 0) {
          sum += service.price * quantity;
        }
      });
    });
    return sum;
  }, [roomServices, services]);

  // Tổng giá phòng + dịch vụ
  const totalPrice = totalRoomPrice + totalServicePrice;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Helper: strip HTML tags từ description
  const stripHtmlTags = (html?: string) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();
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
          // KHÔNG group nữa - gửi từng phòng riêng với services riêng
          const roomsConfigWithServices: AutoAssignRoomConfig[] = roomsData.map(
            (room, roomIndex) => {
              const roomType = roomTypes.find(
                (rt) => rt.id === room.room_type_id
              );
              const price = roomType?.price ?? 0;

              // Lấy services của phòng này
              const itemServices = roomServices[roomIndex] || {};
              const servicesArray = Object.entries(itemServices)
                .filter(([, quantity]) => quantity > 0)
                .map(([serviceId, quantity]) => {
                  const service = services.find(
                    (s) => s.id === Number(serviceId)
                  );
                  return {
                    service_id: Number(serviceId),
                    quantity: quantity,
                    total_service_price: service ? service.price * quantity : 0,
                  };
                });

              console.log(`[DEBUG] Room ${roomIndex} services:`, {
                roomServices: roomServices[roomIndex],
                itemServices,
                servicesArray,
              });

              return {
                room_type_id: room.room_type_id,
                quantity: 1, // Mỗi config = 1 phòng
                check_in: checkin,
                check_out: checkout,
                room_type_price: price * nights,
                num_adults: room.num_adults,
                num_children: room.num_children,
                services: servicesArray.length > 0 ? servicesArray : [],
              };
            }
          );
          const bookingData = {
            customer_name: customerInfo.customer_name,
            customer_email: customerInfo.customer_email,
            customer_phone: customerInfo.customer_phone,
            promo_code: searchParams.promo_code || undefined,
            notes: notes || undefined,
            total_price: totalPrice,
            payment_status: "unpaid",
            booking_method: "online",
            stay_status_id: 1,
            rooms_config: roomsConfigWithServices,
          };
          console.log(
            "[MultiRoomBookingCreate] Chuyển sang PaymentMethodSelect:",
            bookingData
          );

          // KHÔNG tạo booking ở đây nữa, chỉ chuyển dữ liệu sang trang chọn phương thức thanh toán
          navigate("/bookings/payment-method", {
            state: {
              bookingData,
              shouldCreateBooking: true, // Flag để PaymentMethodSelect biết cần tạo booking
            },
          });
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
              {roomsData.map((item: any, idx: number) => {
                const roomName = `Phòng ${idx + 1}`;
                // item.price từ RoomBookingModal đã là tổng giá cho cả kỳ nghỉ (đã nhân với số đêm)
                // Cần tính lại giá mỗi đêm: pricePerNight = totalPrice / nights
                const totalRoomPrice = item.price || 0;
                const pricePerNight = nights > 0 ? totalRoomPrice / nights : totalRoomPrice;

                // Tính tổng giá dịch vụ của phòng này
                const roomServiceMap = roomServices[idx] || {};
                const roomServiceTotal = Object.entries(roomServiceMap).reduce(
                  (sum, [serviceId, quantity]) => {
                    const service = services.find(
                      (s) => s.id === Number(serviceId)
                    );
                    if (service && quantity > 0) {
                      return sum + service.price * quantity;
                    }
                    return sum;
                  },
                  0
                );

                return (
                  <Panel
                    header={
                      <div className="flex justify-between items-center">
                        <Text strong>{roomName}</Text>
                        <div className="text-right">
                          <Text type="secondary" className="block text-xs">
                            {formatPrice(pricePerNight)} / đêm
                          </Text>
                          <Text strong className="text-red-600">
                            {formatPrice(totalRoomPrice)} ({nights} đêm)
                          </Text>
                        </div>
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

                      {/* Dịch vụ cho phòng này */}
                      <Divider orientation="left">
                        <ShoppingOutlined className="mr-2" />
                        <Text strong>Dịch vụ cho phòng này</Text>
                      </Divider>
                      {servicesLoading ? (
                        <div className="text-center py-4">
                          <Text type="secondary">
                            Đang tải danh sách dịch vụ...
                          </Text>
                        </div>
                      ) : services.length === 0 ? (
                        <div className="text-center py-4">
                          <Text type="secondary">
                            Hiện không có dịch vụ nào
                          </Text>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {services.map((service) => {
                            const currentRoomServices = roomServices[idx] || {};
                            const isChecked =
                              !!currentRoomServices[service.id] &&
                              currentRoomServices[service.id] > 0;
                            const quantity =
                              currentRoomServices[service.id] || 0;

                            return (
                              <Card
                                key={service.id}
                                size="small"
                                className="hover:shadow-md transition"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <Checkbox
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const newRoomServices = {
                                            ...roomServices,
                                          };
                                          if (!newRoomServices[idx]) {
                                            newRoomServices[idx] = {};
                                          }
                                          if (e.target.checked) {
                                            newRoomServices[idx][service.id] =
                                              1;
                                          } else {
                                            delete newRoomServices[idx][
                                              service.id
                                            ];
                                          }
                                          setRoomServices(newRoomServices);
                                        }}
                                      />
                                      <div className="flex-1">
                                        <Text strong className="text-base">
                                          {service.name}
                                        </Text>
                                        {service.description && (
                                          <div className="text-sm text-gray-600 mt-1">
                                            {stripHtmlTags(service.description)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4">
                                    {isChecked && (
                                      <InputNumber
                                        min={1}
                                        max={10}
                                        value={quantity}
                                        onChange={(value) => {
                                          const newRoomServices = {
                                            ...roomServices,
                                          };
                                          if (!newRoomServices[idx]) {
                                            newRoomServices[idx] = {};
                                          }
                                          if (value && value > 0) {
                                            newRoomServices[idx][service.id] =
                                              value;
                                          } else {
                                            delete newRoomServices[idx][
                                              service.id
                                            ];
                                          }
                                          setRoomServices(newRoomServices);
                                        }}
                                        style={{ width: 80 }}
                                      />
                                    )}
                                    <Text
                                      strong
                                      className="text-blue-600 min-w-[100px] text-right"
                                    >
                                      {formatPrice(service.price)}
                                    </Text>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                          {roomServiceTotal > 0 && (
                            <Card className="bg-blue-50 border-blue-200">
                              <div className="flex justify-between items-center">
                                <Text strong>Tổng dịch vụ phòng này:</Text>
                                <Text strong className="text-lg text-blue-600">
                                  {formatPrice(roomServiceTotal)}
                                </Text>
                              </div>
                            </Card>
                          )}
                        </div>
                      )}
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

              {/* Dịch vụ đã chọn theo từng phòng */}
              {Object.keys(roomServices).length > 0 && (
                <Card title={<strong>Dịch vụ đã chọn</strong>}>
                  <div className="space-y-4">
                    {Object.entries(roomServices).map(
                      ([roomIndex, serviceMap]) => {
                        const idx = Number(roomIndex);
                        const roomName = `Phòng ${idx + 1}`;

                        const roomServiceTotal = Object.entries(
                          serviceMap
                        ).reduce((sum, [serviceId, quantity]) => {
                          const service = services.find(
                            (s) => s.id === Number(serviceId)
                          );
                          if (service && quantity > 0) {
                            return sum + service.price * quantity;
                          }
                          return sum;
                        }, 0);

                        if (roomServiceTotal === 0) return null;

                        return (
                          <div
                            key={roomIndex}
                            className="border-b border-gray-200 pb-3 mb-3 last:border-b-0"
                          >
                            <Text strong className="block mb-2">
                              {roomName}
                            </Text>
                            <div className="space-y-2 ml-4">
                              {Object.entries(serviceMap).map(
                                ([serviceId, quantity]) => {
                                  const service = services.find(
                                    (s) => s.id === Number(serviceId)
                                  );
                                  if (!service || quantity <= 0) return null;
                                  return (
                                    <div
                                      key={serviceId}
                                      className="flex justify-between items-center"
                                    >
                                      <div>
                                        <Text>{service.name}</Text>
                                        <Text type="secondary" className="ml-2">
                                          x{quantity}
                                        </Text>
                                      </div>
                                      <Text strong>
                                        {formatPrice(service.price * quantity)}
                                      </Text>
                                    </div>
                                  );
                                }
                              )}
                              <div className="flex justify-between pt-1 border-t border-gray-100">
                                <Text type="secondary">Tổng phòng này:</Text>
                                <Text strong className="text-blue-600">
                                  {formatPrice(roomServiceTotal)}
                                </Text>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                    <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                      <Text strong>Tổng tất cả dịch vụ:</Text>
                      <Text strong className="text-lg text-blue-600">
                        {formatPrice(totalServicePrice)}
                      </Text>
                    </div>
                  </div>
                </Card>
              )}

              <Card title={<strong>Tổng chi phí</strong>}>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span>Tiền phòng ({nights} đêm)</span>
                    <strong>{formatPrice(totalRoomPrice)}</strong>
                  </div>
                  {totalServicePrice > 0 && (
                    <div className="flex justify-between">
                      <span>Dịch vụ</span>
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
            <Button onClick={handlePrev}>Quay lại</Button>
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNext}>
                Tiếp theo
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
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
