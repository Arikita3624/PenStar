/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
  message,
  DatePicker,
  InputNumber,
  Select,
  Space,
  Typography,
  Divider,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services/servicesApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { createBooking } from "@/services/bookingsApi";
import type { Services } from "@/types/services";
import type { RoomType } from "@/types/roomtypes";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AdminWalkInBooking = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Load dữ liệu
  const { data: services = [] } = useQuery<Services[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["roomTypes"],
    queryFn: getRoomTypes,
  });

  const [selectedRooms, setSelectedRooms] = useState<
    Array<{
      room_type_id: number;
      quantity: number;
      num_adults: number;
      num_children: number;
      services: Array<{ service_id: number; quantity: number }>;
    }>
  >([]);

  const handleAddRoom = () => {
    const values = form.getFieldsValue();
    if (!values.room_type_id) {
      message.error("Vui lòng chọn loại phòng");
      return;
    }
    
    // Kiểm tra dateRange từ state hoặc form
    const currentDateRange = dateRange || values.dateRange;
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) {
      message.error("Vui lòng chọn ngày nhận và trả phòng ở bước 1");
      return;
    }

    const roomType = roomTypes.find((rt) => rt.id === values.room_type_id);
    if (!roomType) {
      message.error("Không tìm thấy loại phòng");
      return;
    }

    // Validation số lượng người
    const numAdults = values.num_adults || 1;
    const numChildren = values.num_children || 0;
    const totalGuests = numAdults + numChildren;

    // Kiểm tra số người lớn
    if (roomType.max_adults && numAdults > roomType.max_adults) {
      message.error(
        `Số người lớn không được vượt quá ${roomType.max_adults} người cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Kiểm tra số trẻ em
    if (roomType.max_children && numChildren > roomType.max_children) {
      message.error(
        `Số trẻ em không được vượt quá ${roomType.max_children} trẻ cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Kiểm tra tổng số người (capacity)
    if (roomType.capacity && totalGuests > roomType.capacity) {
      message.error(
        `Tổng số người (${totalGuests}) không được vượt quá sức chứa của phòng (${roomType.capacity} người) cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Kiểm tra số người lớn tối thiểu
    if (numAdults < 1) {
      message.error("Phải có ít nhất 1 người lớn");
      return;
    }

    const newRoom = {
      room_type_id: values.room_type_id,
      quantity: values.quantity || 1,
      num_adults: numAdults,
      num_children: numChildren,
      services: [],
    };

    setSelectedRooms([...selectedRooms, newRoom]);
    form.setFieldsValue({
      room_type_id: undefined,
      quantity: 1,
      num_adults: 1,
      num_children: 0,
    });
    message.success("Đã thêm phòng vào danh sách");
  };

  const handleRemoveRoom = (index: number) => {
    const newRooms = selectedRooms.filter((_, i) => i !== index);
    setSelectedRooms(newRooms);
  };

  const calculateTotal = () => {
    const values = form.getFieldsValue();
    const currentDateRange = dateRange || values.dateRange;
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) return 0;

    const checkIn = dayjs(Array.isArray(currentDateRange) ? currentDateRange[0] : currentDateRange);
    const checkOut = dayjs(Array.isArray(currentDateRange) ? currentDateRange[1] : currentDateRange);
    const nights = checkOut.diff(checkIn, "day");

    let total = 0;
    selectedRooms.forEach((room) => {
      const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
      if (roomType && roomType.price) {
        total += roomType.price * nights * room.quantity;
      }
      room.services.forEach((service) => {
        const serviceInfo = services.find((s) => s.id === service.service_id);
        if (serviceInfo) {
          total += serviceInfo.price * service.quantity;
        }
      });
    });

    return total;
  };

  const handleSubmit = async () => {
    try {
      // Lấy tất cả giá trị từ form (kể cả các field không được render)
      const allFormValues = form.getFieldsValue(true);
      
      // Kiểm tra các field bắt buộc thủ công
      if (!allFormValues.customer_name) {
        message.error("Vui lòng nhập tên khách hàng");
        // Quay lại bước 1 để nhập
        setCurrentStep(0);
        form.scrollToField("customer_name");
        return;
      }
      if (!allFormValues.customer_phone) {
        message.error("Vui lòng nhập số điện thoại");
        setCurrentStep(0);
        form.scrollToField("customer_phone");
        return;
      }
      
      if (selectedRooms.length === 0) {
        message.error("Vui lòng thêm ít nhất một phòng");
        setCurrentStep(1);
        return;
      }

      const currentDateRange = dateRange || allFormValues.dateRange;
      if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) {
        message.error("Vui lòng chọn ngày nhận và trả phòng");
        setCurrentStep(0);
        form.scrollToField("dateRange");
        return;
      }

      setLoading(true);

      const dateArray = Array.isArray(currentDateRange) ? currentDateRange : [currentDateRange, currentDateRange];
      const checkIn = dayjs(dateArray[0]).format("YYYY-MM-DD");
      const checkOut = dayjs(dateArray[1]).format("YYYY-MM-DD");
      const nights = dayjs(dateArray[1]).diff(
        dayjs(dateArray[0]),
        "day"
      );

      const roomsConfig = selectedRooms.map((room) => {
        const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
        const servicesArray = room.services.map((s) => {
          const serviceInfo = services.find((sv) => sv.id === s.service_id);
          return {
            service_id: s.service_id,
            quantity: s.quantity,
            total_service_price: serviceInfo
              ? serviceInfo.price * s.quantity
              : 0,
          };
        });

        return {
          room_type_id: room.room_type_id,
          quantity: room.quantity,
          check_in: checkIn,
          check_out: checkOut,
          room_type_price: roomType && roomType.price ? roomType.price * nights : 0,
          num_adults: room.num_adults,
          num_children: room.num_children,
          services: servicesArray,
        };
      });

      const bookingData = {
        customer_name: allFormValues.customer_name,
        customer_email: allFormValues.customer_email || null,
        customer_phone: allFormValues.customer_phone,
        notes: allFormValues.notes || null,
        total_price: calculateTotal(),
        payment_status: "pending", // Chờ thanh toán tại quầy
        payment_method: allFormValues.payment_method || null,
        booking_method: "offline", // Đặt phòng trực tiếp
        stay_status_id: 6, // Pending - chờ duyệt
        rooms_config: roomsConfig,
      };

      const booking = await createBooking(bookingData as any);
      message.success("Đã tạo booking thành công!");
      navigate(`/admin/bookings/${booking.id}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      message.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Thông tin khách hàng",
      icon: <UserOutlined />,
    },
    {
      title: "Chọn phòng",
      icon: <HomeOutlined />,
    },
    {
      title: "Xác nhận",
      icon: <UserOutlined />,
    },
  ];

  return (
    <div className="bg-gray-50 py-6 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <Title level={2}>Đặt phòng cho khách đến trực tiếp</Title>
          <Steps current={currentStep} items={steps} className="mb-8" />

          <Form form={form} layout="vertical">
            {/* Step 1: Customer Info */}
            {currentStep === 0 && (
              <div>
                <Title level={4}>Thông tin khách hàng</Title>
                <Form.Item
                  name="customer_name"
                  label="Tên khách hàng"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên khách hàng" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập tên khách hàng"
                  />
                </Form.Item>

                <Form.Item
                  name="customer_phone"
                  label="Số điện thoại"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập số điện thoại",
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Item>

                <Form.Item name="customer_email" label="Email">
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Nhập email (tùy chọn)"
                  />
                </Form.Item>

                <Form.Item
                  name="dateRange"
                  label="Ngày nhận và trả phòng"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn ngày nhận và trả phòng",
                    },
                  ]}
                >
                  <RangePicker
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setDateRange([dates[0], dates[1]]);
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item name="notes" label="Ghi chú">
                  <TextArea rows={3} placeholder="Ghi chú (tùy chọn)" />
                </Form.Item>
              </div>
            )}

            {/* Step 2: Select Rooms */}
            {currentStep === 1 && (
              <div>
                <Title level={4}>Chọn phòng</Title>
                <Card>
                  <Form.Item 
                    name="room_type_id" 
                    label="Loại phòng"
                    dependencies={["num_adults", "num_children"]}
                  >
                    <Select 
                      placeholder="Chọn loại phòng"
                      onChange={(value) => {
                        setSelectedRoomTypeId(value);
                        // Reset validation khi đổi loại phòng
                        form.validateFields(["num_adults", "num_children"]);
                      }}
                    >
                      {roomTypes.map((rt) => (
                        <Select.Option key={rt.id} value={rt.id}>
                          {rt.name} - {rt.price ? rt.price.toLocaleString("vi-VN") : 0} VND/đêm
                          {rt.capacity && ` (Tối đa ${rt.capacity} người)`}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  
                  {/* Hiển thị thông tin giới hạn của loại phòng đã chọn */}
                  {selectedRoomTypeId && (() => {
                    const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);
                    if (selectedRoomType) {
                      return (
                        <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f2f5", borderRadius: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <strong>Thông tin loại phòng:</strong>
                            {selectedRoomType.max_adults && (
                              <> Tối đa {selectedRoomType.max_adults} người lớn</>
                            )}
                            {selectedRoomType.max_children && (
                              <> • Tối đa {selectedRoomType.max_children} trẻ em</>
                            )}
                            {selectedRoomType.capacity && (
                              <> • Sức chứa: {selectedRoomType.capacity} người</>
                            )}
                          </Text>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <Form.Item name="quantity" label="Số lượng phòng" initialValue={1}>
                    <InputNumber min={1} max={10} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="num_adults"
                    label="Số người lớn"
                    initialValue={1}
                    dependencies={["num_children", "room_type_id"]}
                    rules={[
                      { required: true, message: "Vui lòng nhập số người lớn" },
                      { type: "number", min: 1, message: "Phải có ít nhất 1 người lớn" },
                      {
                        validator: (_, value) => {
                          const roomTypeId = form.getFieldValue("room_type_id");
                          if (!roomTypeId) return Promise.resolve();
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          if (roomType && roomType.max_adults && value > roomType.max_adults) {
                            return Promise.reject(
                              new Error(
                                `Số người lớn không được vượt quá ${roomType.max_adults} người`
                              )
                            );
                          }
                          // Kiểm tra tổng số người
                          const numChildren = form.getFieldValue("num_children") || 0;
                          const totalGuests = value + numChildren;
                          if (roomType && roomType.capacity && totalGuests > roomType.capacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${roomType.capacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber min={1} max={20} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item
                    name="num_children"
                    label="Số trẻ em"
                    initialValue={0}
                    dependencies={["num_adults", "room_type_id"]}
                    rules={[
                      { type: "number", min: 0, message: "Số trẻ em không được âm" },
                      {
                        validator: (_, value) => {
                          const roomTypeId = form.getFieldValue("room_type_id");
                          if (!roomTypeId) return Promise.resolve();
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          if (roomType && roomType.max_children && value > roomType.max_children) {
                            return Promise.reject(
                              new Error(
                                `Số trẻ em không được vượt quá ${roomType.max_children} trẻ`
                              )
                            );
                          }
                          // Kiểm tra tổng số người
                          const numAdults = form.getFieldValue("num_adults") || 1;
                          const totalGuests = numAdults + (value || 0);
                          if (roomType && roomType.capacity && totalGuests > roomType.capacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${roomType.capacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber min={0} max={20} style={{ width: "100%" }} />
                  </Form.Item>

                  <Button type="primary" onClick={handleAddRoom} block>
                    Thêm phòng vào danh sách
                  </Button>
                </Card>

                <Divider />

                <Title level={5}>Danh sách phòng đã chọn</Title>
                {selectedRooms.length === 0 ? (
                  <Text type="secondary">Chưa có phòng nào được chọn</Text>
                ) : (
                  selectedRooms.map((room, index) => {
                    const roomType = roomTypes.find(
                      (rt) => rt.id === room.room_type_id
                    );
                    return (
                      <Card key={index} className="mb-4">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <div>
                            <Text strong>{roomType?.name}</Text>
                            <Button
                              danger
                              size="small"
                              onClick={() => handleRemoveRoom(index)}
                              style={{ float: "right" }}
                            >
                              Xóa
                            </Button>
                          </div>
                          <Text>
                            Số lượng: {room.quantity} | Người lớn:{" "}
                            {room.num_adults} | Trẻ em: {room.num_children}
                          </Text>
                        </Space>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 2 && (
              <div>
                <Title level={4}>Xác nhận thông tin</Title>
                <Card>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>Khách hàng: </Text>
                      <Text>{form.getFieldValue("customer_name")}</Text>
                    </div>
                    <div>
                      <Text strong>Số điện thoại: </Text>
                      <Text>{form.getFieldValue("customer_phone")}</Text>
                    </div>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>
                        {form.getFieldValue("customer_email") || "—"}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Tổng tiền: </Text>
                      <Text strong style={{ color: "#ff4d4f", fontSize: 18 }}>
                        {calculateTotal().toLocaleString("vi-VN")} VND
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Form.Item
                  name="payment_method"
                  label="Phương thức thanh toán dự kiến"
                  initialValue="cash"
                >
                  <Select placeholder="Chọn phương thức thanh toán">
                    <Select.Option value="cash">Tiền mặt</Select.Option>
                    <Select.Option value="card">Thẻ</Select.Option>
                    <Select.Option value="transfer">Chuyển khoản</Select.Option>
                    <Select.Option value="momo">MoMo</Select.Option>
                    <Select.Option value="vnpay">VNPay</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={() => setCurrentStep((s) => s - 1)}>
                    Quay lại
                  </Button>
                )}
                {currentStep < steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        // Validate form trước khi chuyển bước
                        await form.validateFields();
                        
                        // Lưu dateRange vào state khi chuyển từ bước 1 sang bước 2
                        if (currentStep === 0) {
                          const values = form.getFieldsValue();
                          if (
                            values.dateRange &&
                            Array.isArray(values.dateRange) &&
                            values.dateRange.length === 2
                          ) {
                            setDateRange([
                              dayjs(values.dateRange[0]),
                              dayjs(values.dateRange[1]),
                            ]);
                          }
                        }
                        
                        setCurrentStep((s) => s + 1);
                      } catch (error) {
                        // Form validation failed, error messages will be shown automatically
                        console.error("Validation error:", error);
                      }
                    }}
                  >
                    Tiếp theo
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    size="large"
                  >
                    Tạo booking
                  </Button>
                )}
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AdminWalkInBooking;

