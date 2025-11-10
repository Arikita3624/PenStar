/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
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
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getServices } from "@/services/servicesApi";
import { createBooking } from "@/services/bookingsApi";
import type { RoomSearchParams } from "@/types/room";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";

const { Panel } = Collapse;
const { TextArea } = Input;

interface RoomBookingData {
  room_id: number;
  num_adults: number;
  num_children: number;
  special_requests?: string;
  service_ids: number[];
}

const MultiRoomBookingCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  const selectedRoomIds: number[] = location.state?.selectedRoomIds || [];
  const searchParams: RoomSearchParams = location.state?.searchParams;
  const roomsConfig: Array<{ num_adults: number; num_children: number }> =
    location.state?.roomsConfig || [];
  const promoCode = searchParams?.promo_code;

  const [roomsData, setRoomsData] = useState<RoomBookingData[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [notes, setNotes] = useState("");

  // Fetch room details
  const roomQueries = useQuery({
    queryKey: ["multiRoomDetails", selectedRoomIds],
    queryFn: async () => {
      const promises = selectedRoomIds.map((id) => getRoomID(id));
      return Promise.all(promises);
    },
    enabled: selectedRoomIds.length > 0,
  });

  const { data: services = [] } = useQuery<Services[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const createBookingMutation = useMutation<
    { data: { id: number } },
    Error,
    Record<string, unknown>
  >({
    mutationFn: async (data: Record<string, unknown>) => {
      console.log("Sending booking data:", JSON.stringify(data, null, 2));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createBooking(data as any);
      return { data: { id: result.id || 0 } };
    },
    onSuccess: (response) => {
      console.log("[MultiRoomBookingCreate] onSuccess response:", response);
      message.success("Đặt phòng thành công!");
      const bookingId = response.data.id;
      console.log("[MultiRoomBookingCreate] bookingId:", bookingId);

      // Customer đã đăng nhập -> đi đến customer success page
      navigate(`/bookings/success/${bookingId}`);
    },
    onError: (error: any) => {
      console.error("Booking error:", error);
      console.error("Error response:", error.response?.data);
      message.error(
        "Đặt phòng thất bại: " +
          (error.response?.data?.message || error.message)
      );
    },
  });

  useEffect(() => {
    if (!selectedRoomIds || selectedRoomIds.length === 0) {
      message.warning("Vui lòng chọn phòng trước");
      navigate("/");
      return;
    }

    // Initialize rooms data với guest counts từ Results page
    const initialData = selectedRoomIds.map((roomId, index) => {
      const config = roomsConfig[index] || { num_adults: 1, num_children: 0 };

      return {
        room_id: roomId,
        num_adults: config.num_adults,
        num_children: config.num_children,
        special_requests: "",
        service_ids: [],
      };
    });
    setRoomsData(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRoomDataChange = (
    roomIndex: number,
    field: keyof RoomBookingData,
    value: number | string | number[]
  ) => {
    const newData = [...roomsData];
    newData[roomIndex] = { ...newData[roomIndex], [field]: value };
    setRoomsData(newData);
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      // Validate customer info
      if (
        !customerInfo.customer_name ||
        !customerInfo.customer_phone ||
        !customerInfo.customer_email
      ) {
        message.error("Vui lòng nhập đầy đủ thông tin khách hàng");
        return false;
      }
    } else if (step === 1) {
      // Chỉ validate capacity cơ bản
      for (let i = 0; i < roomsData.length; i++) {
        const room = roomsData[i];
        const roomInfo = rooms[i];

        // Validate total capacity
        const totalGuests = room.num_adults + room.num_children;
        if (roomInfo && totalGuests > roomInfo.capacity) {
          message.error(
            `Phòng "${roomInfo.name}" chỉ chứa tối đa ${roomInfo.capacity} người (hiện tại: ${totalGuests})`
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    const total_adults = roomsData.reduce((sum, r) => sum + r.num_adults, 0);
    const total_children = roomsData.reduce(
      (sum, r) => sum + r.num_children,
      0
    );

    // Tính số đêm
    const checkin = searchParams.check_in;
    const checkout = searchParams.check_out;
    const nights =
      checkin && checkout
        ? Math.max(
            1,
            Math.ceil(
              (new Date(checkout).getTime() - new Date(checkin).getTime()) /
                (1000 * 3600 * 24)
            )
          )
        : 1;

    // Calculate total price: tổng giá phòng × số đêm
    const total_room_price = rooms.reduce(
      (sum: number, room: Room) => sum + Number(room.price) * nights,
      0
    );
    const total_service_price = roomsData.reduce((sum: number, roomData) => {
      const roomServices = services.filter((s: Services) =>
        roomData.service_ids.includes(s.id)
      );
      return (
        sum +
        roomServices.reduce(
          (sSum: number, service: Services) => sSum + Number(service.price),
          0
        )
      );
    }, 0);
    const total_price = total_room_price + total_service_price;

    // Transform rooms data to backend format
    const items = roomsData.map((roomData, index) => {
      const roomInfo = rooms[index];

      return {
        room_id: roomData.room_id,
        check_in: searchParams.check_in,
        check_out: searchParams.check_out,
        room_price: Number(roomInfo?.price || 0) * nights, // Giá phòng × số đêm
        num_adults: roomData.num_adults,
        num_children: roomData.num_children,
      };
    });

    // Transform services data
    const services_data = roomsData.flatMap((roomData) =>
      roomData.service_ids.map((service_id) => {
        const service = services.find((s: Services) => s.id === service_id);
        return {
          service_id,
          quantity: 1,
          total_service_price: Number(service?.price || 0),
        };
      })
    );

    interface MultiRoomBookingPayload {
      customer_name: string;
      customer_email?: string;
      customer_phone?: string;
      promo_code?: string;
      notes?: string;
      total_price: number;
      payment_status: string;
      booking_method: string;
      stay_status_id: number;
      items: typeof items;
      services?: typeof services_data;
    }

    const bookingData: MultiRoomBookingPayload = {
      customer_name: customerInfo.customer_name,
      customer_email: customerInfo.customer_email,
      customer_phone: customerInfo.customer_phone,
      promo_code: promoCode || undefined,
      notes: notes || undefined,
      total_price,
      payment_status: "unpaid",
      booking_method: "online",
      stay_status_id: 1,
      items,
      services: services_data.length > 0 ? services_data : undefined,
    };

    createBookingMutation.mutate(
      bookingData as unknown as Record<string, unknown>,
      {
        onSuccess: (data: any) => {
          const bookingId = data?.data?.id;
          if (bookingId) {
            message.success(
              "Đặt phòng thành công! Vui lòng chọn phương thức thanh toán."
            );
            navigate("/bookings/payment-method", {
              state: {
                bookingId,
                bookingInfo: data?.data,
              },
            });
          }
        },
      }
    );
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const rooms: Room[] = roomQueries.data || [];
  // Tính số đêm
  const checkin = searchParams?.check_in;
  const checkout = searchParams?.check_out;
  const nights =
    checkin && checkout
      ? Math.max(
          1,
          Math.ceil(
            (new Date(checkout).getTime() - new Date(checkin).getTime()) /
              (1000 * 3600 * 24)
          )
        )
      : 1;

  // Tính tổng giá phòng
  const totalRoomPrice = rooms.reduce(
    (sum: number, room: Room) => sum + Number(room.price) * nights,
    0
  );

  // Tính tổng giá dịch vụ
  const totalServicePrice = roomsData.reduce((sum: number, roomData) => {
    const roomServices = services.filter((s: Services) =>
      roomData.service_ids.includes(s.id)
    );
    return (
      sum +
      roomServices.reduce(
        (sSum: number, service: Services) => sSum + Number(service.price),
        0
      )
    );
  }, 0);

  // Tổng cộng
  const totalPrice = totalRoomPrice + totalServicePrice;

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section - Compact */}
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
              Đặt {selectedRoomIds.length} phòng
            </h1>
            <p
              className="text-white text-xs"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              Hoàn tất thông tin để xác nhận đặt phòng
            </p>
          </div>
        </div>

        <Card
          className="rounded-xl overflow-hidden border-0"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <Steps current={currentStep} className="mb-6" size="small">
            <Steps.Step title="Thông tin khách hàng" icon={<UserOutlined />} />
            <Steps.Step
              title="Thông tin phòng & khách"
              icon={<HomeOutlined />}
            />
            <Steps.Step title="Xác nhận" />
          </Steps>

          {/* Step 0: Customer Info */}
          {currentStep === 0 && (
            <div className="space-y-3" style={{ marginTop: "24px" }}>
              <div
                className="p-3 rounded-lg mb-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,79,134,0.05) 0%, rgba(13,110,171,0.05) 100%)",
                  border: "1px solid rgba(10,79,134,0.1)",
                }}
              >
                <h3 className="text-lg font-bold mb-1 text-[#0a4f86]">
                  Thông tin liên hệ
                </h3>
                <p className="text-gray-600 text-sm">
                  Vui lòng cung cấp thông tin để chúng tôi liên hệ xác nhận đặt
                  phòng
                </p>
              </div>
              <Form layout="vertical" form={form}>
                <Form.Item
                  label="Họ và tên"
                  required
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nguyễn Văn A"
                    size="middle"
                    value={customerInfo.customer_name}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  required
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại" },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="0912345678"
                    size="middle"
                    value={customerInfo.customer_phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_phone: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  required
                  rules={[
                    { required: true, message: "Vui lòng nhập email" },
                    { type: "email", message: "Email không hợp lệ" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="email@example.com"
                    size="middle"
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
                    placeholder="Nhập ghi chú cho đơn đặt phòng (nếu có)"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Step 1: Rooms & Guests */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg mb-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,79,134,0.05) 0%, rgba(13,110,171,0.05) 100%)",
                  border: "1px solid rgba(10,79,134,0.1)",
                }}
              >
                <h3 className="text-lg font-bold mb-1 text-[#0a4f86]">
                  Thông tin phòng và khách
                </h3>
                <p className="text-gray-600 text-sm">
                  Cung cấp thông tin chi tiết cho từng phòng
                </p>
              </div>

              <Collapse defaultActiveKey={["0"]} accordion className="border-0">
                {roomsData.map((roomData, roomIndex) => {
                  const room = rooms[roomIndex];
                  if (!room) return null;

                  return (
                    <Panel
                      header={
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">
                            Phòng {roomIndex + 1}: {room.name}
                          </span>
                          <span className="text-[#0a4f86] font-bold text-sm">
                            {formatPrice(room.price)}/đêm
                          </span>
                        </div>
                      }
                      key={roomIndex.toString()}
                      className="mb-3 rounded-lg overflow-hidden border border-gray-200"
                      style={{
                        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <div className="space-y-3">
                        {/* Hiển thị số khách đã chọn */}
                        <div
                          className="p-3 rounded-lg mb-3"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(10,79,134,0.08) 0%, rgba(13,110,171,0.08) 100%)",
                            border: "1px solid rgba(10,79,134,0.15)",
                          }}
                        >
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div className="text-center">
                              <div className="text-2xl mb-0.5">👨</div>
                              <span className="text-gray-700 font-medium block text-xs">
                                Người lớn
                              </span>
                              <span className="text-lg font-bold text-[#0a4f86]">
                                {roomData.num_adults}
                              </span>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl mb-0.5">👶</div>
                              <span className="text-gray-700 font-medium block text-xs">
                                Trẻ em
                              </span>
                              <span className="text-lg font-bold text-[#0d6eab]">
                                {roomData.num_children}
                              </span>
                            </div>
                          </div>
                          <div className="text-center pt-2 border-t border-gray-300">
                            <span className="text-gray-700 font-medium text-sm">
                              Tổng số khách:{" "}
                            </span>
                            <span className="text-base font-bold text-[#0a4f86]">
                              {roomData.num_adults + roomData.num_children}{" "}
                              người
                            </span>
                          </div>
                        </div>

                        {/* Services */}
                        <div>
                          <label className="block mb-2 font-bold text-gray-700 text-sm">
                            Dịch vụ thêm
                          </label>
                          <Select
                            mode="multiple"
                            placeholder="Chọn dịch vụ bổ sung"
                            size="middle"
                            value={roomData.service_ids}
                            onChange={(val) =>
                              handleRoomDataChange(
                                roomIndex,
                                "service_ids",
                                val
                              )
                            }
                            className="w-full"
                          >
                            {services.map((service: Services) => (
                              <Select.Option
                                key={service.id}
                                value={service.id}
                              >
                                {service.name} - {formatPrice(service.price)}
                              </Select.Option>
                            ))}
                          </Select>
                        </div>

                        {/* Special Requests */}
                        <div>
                          <label className="block mb-3 font-bold text-gray-700 text-base">
                            Yêu cầu đặc biệt
                          </label>
                          <TextArea
                            rows={3}
                            placeholder="Ghi chú cho phòng này..."
                            value={roomData.special_requests}
                            onChange={(e) =>
                              handleRoomDataChange(
                                roomIndex,
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
            </div>
          )}

          {/* Step 2: Confirm */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(10,79,134,0.05) 0%, rgba(13,110,171,0.05) 100%)",
                  border: "1px solid rgba(10,79,134,0.1)",
                  marginBottom: "24px",
                }}
              >
                <h3 className="text-lg font-bold mb-1 text-[#0a4f86]">
                  Xác nhận đặt phòng
                </h3>
                <p className="text-gray-600 text-sm">
                  Vui lòng kiểm tra kỹ thông tin trước khi xác nhận
                </p>
              </div>

              <Card
                type="inner"
                title={
                  <span className="text-base font-bold">
                    Thông tin khách hàng
                  </span>
                }
                className="rounded-lg border-0"
                style={{
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Họ tên</div>
                      <div className="font-semibold text-sm">
                        {customerInfo.customer_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Số điện thoại</div>
                      <div className="font-semibold text-sm">
                        {customerInfo.customer_phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="font-semibold text-sm">
                        {customerInfo.customer_email}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                type="inner"
                title={
                  <span className="text-base font-bold">
                    Thông tin đặt phòng
                  </span>
                }
                className="rounded-lg border-0"
                style={{
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Check-in</div>
                      <div className="font-semibold text-sm">
                        {searchParams?.check_in}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Check-out</div>
                      <div className="font-semibold text-sm">
                        {searchParams?.check_out}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-xs text-gray-500">Số phòng</div>
                      <div className="font-semibold text-sm">
                        {selectedRoomIds.length} phòng
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card
                type="inner"
                title={
                  <span className="text-base font-bold">💰 Tổng chi phí</span>
                }
                className="rounded-lg border-0"
                style={{
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                  background:
                    "linear-gradient(135deg, rgba(10,79,134,0.02) 0%, rgba(13,110,171,0.02) 100%)",
                }}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-200">
                    <span className="text-gray-700">
                      Tổng tiền phòng ({nights} đêm)
                    </span>
                    <span className="font-bold text-base text-[#0a4f86]">
                      {formatPrice(totalRoomPrice)}
                    </span>
                  </div>
                  {totalServicePrice > 0 && (
                    <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-200">
                      <span className="text-gray-700">Tổng tiền dịch vụ</span>
                      <span className="font-bold text-base text-[#0d6eab]">
                        {formatPrice(totalServicePrice)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-bold text-gray-800">
                      TỔNG CỘNG
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              size="middle"
              className="px-6"
            >
              ← Quay lại
            </Button>

            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={handleNext}
                size="middle"
                className="px-6"
                style={{
                  background:
                    "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                  borderColor: "transparent",
                }}
              >
                Tiếp theo →
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={createBookingMutation.isPending}
                size="middle"
                className="px-6"
                style={{
                  background:
                    "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                  borderColor: "transparent",
                  fontWeight: "600",
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
