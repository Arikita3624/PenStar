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
  Modal,
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
import { searchAvailableRooms } from "@/services/roomsApi";
import type { Services } from "@/types/services";
import type { RoomType } from "@/types/roomtypes";
import type { Room } from "@/types/room";
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
      room_id?: number; // Thêm room_id để chọn phòng cụ thể
      room_type_id: number;
      quantity: number;
      num_adults: number;
      num_children: number;
      services: Array<{ service_id: number; quantity: number }>;
    }>
  >([]);
  
  // State để lưu danh sách phòng available khi chọn loại phòng
  const [availableRoomsForType, setAvailableRoomsForType] = useState<Room[]>([]);
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false);

  // Tìm kiếm phòng available khi chọn loại phòng
  const handleRoomTypeChange = async (roomTypeId: number) => {
    setSelectedRoomTypeId(roomTypeId);
    form.validateFields(["num_adults", "num_children"]);
    
    // Tìm kiếm phòng available
    const currentDateRange = dateRange || form.getFieldValue("dateRange");
    if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) {
      setAvailableRoomsForType([]);
      return;
    }
    
    const checkIn = dayjs(Array.isArray(currentDateRange) ? currentDateRange[0] : currentDateRange).format("YYYY-MM-DD");
    const checkOut = dayjs(Array.isArray(currentDateRange) ? currentDateRange[1] : currentDateRange).format("YYYY-MM-DD");
    
    setLoadingAvailableRooms(true);
    try {
      const response = await searchAvailableRooms({
        check_in: checkIn,
        check_out: checkOut,
        room_type_id: roomTypeId,
        num_adults: form.getFieldValue("num_adults") || 1,
        num_children: form.getFieldValue("num_children") || 0,
      });
      setAvailableRoomsForType(response.data || []);
    } catch (error) {
      console.error("Error searching available rooms:", error);
      setAvailableRoomsForType([]);
    } finally {
      setLoadingAvailableRooms(false);
    }
  };

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

    // Cho phép vượt quá max_adults 1 người (tính phụ phí)
    const maxAllowedAdults = (roomType.max_adults || 0) + 1;
    if (numAdults > maxAllowedAdults) {
      message.error(
        `Số người lớn không được vượt quá ${maxAllowedAdults} người (${roomType.max_adults} tiêu chuẩn + 1 phụ phí) cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Không giới hạn số trẻ em (chỉ tính phụ phí nếu vượt quá max_children)
    // Kiểm tra tổng số người (capacity) - vẫn giữ giới hạn này
    const maxCapacity = Math.min(roomType.capacity || 4, 4);
    if (totalGuests > maxCapacity) {
      message.error(
        `Tổng số người (${totalGuests}) không được vượt quá sức chứa của phòng (${maxCapacity} người) cho loại phòng ${roomType.name}`
      );
      return;
    }

    // Kiểm tra số người lớn tối thiểu
    if (numAdults < 1) {
      message.error("Phải có ít nhất 1 người lớn");
      return;
    }

    // Chọn phòng cụ thể nếu có available rooms
    let selectedRoomId: number | undefined = undefined;
    if (values.selected_room_id) {
      selectedRoomId = values.selected_room_id;
    } else if (availableRoomsForType.length > 0) {
      // Tự động chọn phòng đầu tiên nếu không chọn
      selectedRoomId = availableRoomsForType[0].id;
    }

    const newRoom = {
      room_id: selectedRoomId, // Thêm room_id nếu có
      room_type_id: values.room_type_id,
      quantity: 1, // Mặc định 1 phòng
      num_adults: numAdults,
      num_children: numChildren,
      services: [],
    };

    setSelectedRooms([...selectedRooms, newRoom]);
    form.setFieldsValue({
      room_type_id: undefined,
      selected_room_id: undefined,
      num_adults: 1,
      num_children: 0,
    });
    setAvailableRoomsForType([]);
    message.success("Đã thêm phòng vào danh sách");
  };

  const handleRemoveRoom = (index: number) => {
    const newRooms = selectedRooms.filter((_, i) => i !== index);
    setSelectedRooms(newRooms);
  };

  const handlePrev = () => {
    if (currentStep === 0) {
      // Ở bước 1 (điền thông tin), hỏi xác nhận trước khi quay lại và xóa dữ liệu
      Modal.confirm({
        title: "Xác nhận hủy đặt phòng",
        content: "Bạn có chắc muốn quay lại? Dữ liệu phòng đã chọn sẽ bị xóa.",
        okText: "Xác nhận",
        cancelText: "Hủy",
        onOk: () => {
          // Xóa dữ liệu phòng đã chọn
          setSelectedRooms([]);
          setSelectedRoomTypeId(undefined);
          setDateRange(null);
          form.resetFields();
          // Quay về trang trước hoặc trang danh sách booking
          navigate("/admin/bookings");
        },
      });
    } else {
      // Ở các bước khác, chỉ quay lại bước trước
      setCurrentStep((s) => s - 1);
    }
  };

  const handleCancelBooking = () => {
    Modal.confirm({
      title: "Xác nhận hủy đặt phòng",
      content: "Bạn có chắc muốn hủy đặt phòng? Tất cả dữ liệu đã nhập sẽ bị xóa.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => {
        // Xóa tất cả dữ liệu
        setSelectedRooms([]);
        setSelectedRoomTypeId(undefined);
        setDateRange(null);
        form.resetFields();
        // Quay về trang danh sách booking
        navigate("/admin/bookings");
      },
    });
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
        // Giá phòng cơ bản
        const basePrice = roomType.price * nights * room.quantity;
        total += basePrice;

        // Tính phụ phí người lớn (nếu vượt quá max_adults)
        if (room.num_adults > (roomType.max_adults || 0)) {
          const excessAdults = room.num_adults - (roomType.max_adults || 0);
          const adultSurcharge = excessAdults * (roomType.adult_surcharge || 0) * nights * room.quantity;
          total += adultSurcharge;
        }

        // Tính phụ phí trẻ em (chỉ khi vượt quá max_children)
        const excessChildren = Math.max(0, room.num_children - (roomType.max_children || 0));
        if (excessChildren > 0 && roomType.child_surcharge) {
          const childSurcharge = excessChildren * (roomType.child_surcharge || 0) * nights * room.quantity;
          total += childSurcharge;
        }
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

      // Nếu có room_id cụ thể, gửi items thay vì rooms_config
      const hasSpecificRooms = selectedRooms.some((room) => room.room_id);
      
      if (hasSpecificRooms) {
        // Gửi items với room_id cụ thể
        const items = selectedRooms.map((room) => {
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

          // Tính giá cơ bản (trừ phụ phí) để backend tính lại phụ phí
          const basePrice = roomType && roomType.price ? roomType.price * nights : 0;

          return {
            room_id: room.room_id!,
            room_type_id: room.room_type_id,
            check_in: checkIn,
            check_out: checkOut,
            room_type_price: basePrice, // Giá cơ bản, backend sẽ tính lại phụ phí
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
          payment_status: "pending",
          payment_method: allFormValues.payment_method || null,
          booking_method: "offline",
          stay_status_id: 6,
          items: items, // Gửi items với room_id cụ thể
        };

        const booking = await createBooking(bookingData as any);
        message.success("Đã tạo booking thành công!");
        navigate(`/admin/bookings/${booking.id}`);
      } else {
        // Nếu không có room_id, vẫn dùng rooms_config (auto-assign)
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
          payment_status: "pending",
          payment_method: allFormValues.payment_method || null,
          booking_method: "offline",
          stay_status_id: 6,
          rooms_config: roomsConfig,
        };

        const booking = await createBooking(bookingData as any);
        message.success("Đã tạo booking thành công!");
        navigate(`/admin/bookings/${booking.id}`);
      }
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
                        handleRoomTypeChange(value);
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

                  {/* Chọn phòng cụ thể nếu có available rooms */}
                  {selectedRoomTypeId && availableRoomsForType.length > 0 && (
                    <Form.Item
                      name="selected_room_id"
                      label="Chọn phòng cụ thể"
                      dependencies={["room_type_id", "num_adults", "num_children"]}
                    >
                      <Select 
                        placeholder="Chọn phòng (tùy chọn - để trống sẽ tự động chọn phòng đầu tiên)"
                        loading={loadingAvailableRooms}
                        onChange={() => {
                          // Re-validate khi chọn phòng
                          form.validateFields(["num_adults", "num_children"]);
                        }}
                      >
                        {availableRoomsForType.map((room) => (
                          <Select.Option key={room.id} value={room.id}>
                            {room.name} - {room.status === "available" ? "Sẵn sàng" : room.status}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                  
                  {selectedRoomTypeId && availableRoomsForType.length === 0 && !loadingAvailableRooms && (
                    <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff1f0", borderRadius: 4 }}>
                      <Text type="danger" style={{ fontSize: 12 }}>
                        ⚠️ Không có phòng nào khả dụng cho loại phòng này trong khoảng thời gian đã chọn. Vui lòng chọn loại phòng khác hoặc thay đổi ngày.
                      </Text>
                    </div>
                  )}

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
                          // Kiểm tra tổng số người (capacity)
                          const numChildren = form.getFieldValue("num_children") || 0;
                          const totalGuests = value + numChildren;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          if (roomType && totalGuests > maxCapacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${maxCapacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber 
                      min={1} 
                      max={(() => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (!roomTypeId) return 20;
                        const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                        const numChildren = form.getFieldValue("num_children") || 0;
                        const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                        // Tối đa = capacity - số trẻ em (đảm bảo tổng không vượt quá capacity)
                        return Math.max(1, maxCapacity - numChildren);
                      })()}
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (roomTypeId) {
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          const numChildren = form.getFieldValue("num_children") || 0;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          const maxAdults = Math.max(1, maxCapacity - numChildren);
                          // Tự động giới hạn nếu nhập quá
                          if (value && value > maxAdults) {
                            form.setFieldValue("num_adults", maxAdults);
                            message.warning(`Số người lớn tối đa là ${maxAdults} (tổng không vượt quá ${maxCapacity} người)`);
                          }
                        }
                        // Trigger validation lại khi thay đổi
                        form.validateFields(["num_adults", "num_children"]);
                      }}
                    />
                  </Form.Item>
                  <Form.Item dependencies={["num_adults", "room_type_id"]} noStyle>
                    {({ getFieldValue }) => {
                      const roomTypeId = getFieldValue("room_type_id");
                      const numAdults = getFieldValue("num_adults") || 1;
                      if (!roomTypeId) return null;
                      const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId);
                      if (!selectedRoomType) return null;
                      const excessAdults = Math.max(0, numAdults - (selectedRoomType.max_adults || 0));
                      if (excessAdults > 0 && selectedRoomType.adult_surcharge) {
                        return (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff7e6", borderRadius: 4 }}>
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ▲ Vượt quá {selectedRoomType.max_adults} người lớn tiêu chuẩn. Sẽ tính thêm phụ phí: {excessAdults} × {selectedRoomType.adult_surcharge.toLocaleString("vi-VN")} ₫ = {(excessAdults * selectedRoomType.adult_surcharge).toLocaleString("vi-VN")} ₫/đêm
                            </Text>
                          </div>
                        );
                      }
                      return null;
                    }}
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
                          // Kiểm tra tổng số người
                          const numAdults = form.getFieldValue("num_adults") || 1;
                          const totalGuests = numAdults + (value || 0);
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          if (roomType && totalGuests > maxCapacity) {
                            return Promise.reject(
                              new Error(
                                `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${maxCapacity} người)`
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={(() => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (!roomTypeId) return 20;
                        const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                        const numAdults = form.getFieldValue("num_adults") || 1;
                        const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                        // Tối đa = capacity - số người lớn (đảm bảo tổng không vượt quá capacity)
                        return Math.max(0, maxCapacity - numAdults);
                      })()}
                      style={{ width: "100%" }}
                      onChange={(value) => {
                        const roomTypeId = form.getFieldValue("room_type_id");
                        if (roomTypeId) {
                          const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
                          const numAdults = form.getFieldValue("num_adults") || 1;
                          const maxCapacity = Math.min(roomType?.capacity || 4, 4);
                          const maxChildren = Math.max(0, maxCapacity - numAdults);
                          // Tự động giới hạn nếu nhập quá
                          if (value && value > maxChildren) {
                            form.setFieldValue("num_children", maxChildren);
                            message.warning(`Số trẻ em tối đa là ${maxChildren} (tổng không vượt quá ${maxCapacity} người)`);
                          }
                        }
                        // Trigger validation lại khi thay đổi
                        form.validateFields(["num_adults", "num_children"]);
                      }}
                    />
                  </Form.Item>
                  <Form.Item dependencies={["num_children", "room_type_id"]} noStyle>
                    {({ getFieldValue }) => {
                      const roomTypeId = getFieldValue("room_type_id");
                      const numChildren = getFieldValue("num_children") || 0;
                      if (!roomTypeId) return null;
                      const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId);
                      if (!selectedRoomType) return null;
                      const excessChildren = Math.max(0, numChildren - (selectedRoomType.max_children || 0));
                      if (excessChildren > 0 && selectedRoomType.child_surcharge) {
                        return (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#fff7e6", borderRadius: 4 }}>
                            <Text type="warning" style={{ fontSize: 12 }}>
                              ▲ Vượt quá {selectedRoomType.max_children} trẻ em tiêu chuẩn. Sẽ tính thêm phụ phí: {excessChildren} × {selectedRoomType.child_surcharge.toLocaleString("vi-VN")} ₫ = {(excessChildren * selectedRoomType.child_surcharge).toLocaleString("vi-VN")} ₫/đêm
                            </Text>
                          </div>
                        );
                      }
                      return null;
                    }}
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
                    {(() => {
                      const values = form.getFieldsValue();
                      const currentDateRange = dateRange || values.dateRange;
                      if (!currentDateRange || (Array.isArray(currentDateRange) && currentDateRange.length !== 2)) return null;
                      const checkIn = dayjs(Array.isArray(currentDateRange) ? currentDateRange[0] : currentDateRange);
                      const checkOut = dayjs(Array.isArray(currentDateRange) ? currentDateRange[1] : currentDateRange);
                      const nights = checkOut.diff(checkIn, "day");
                      
                      let baseTotal = 0;
                      let adultSurchargeTotal = 0;
                      let childSurchargeTotal = 0;
                      
                      selectedRooms.forEach((room) => {
                        const roomType = roomTypes.find((rt) => rt.id === room.room_type_id);
                        if (roomType && roomType.price) {
                          baseTotal += roomType.price * nights * room.quantity;
                          
                          if (room.num_adults > (roomType.max_adults || 0)) {
                            const excessAdults = room.num_adults - (roomType.max_adults || 0);
                            adultSurchargeTotal += excessAdults * (roomType.adult_surcharge || 0) * nights * room.quantity;
                          }
                          
                          const excessChildren = Math.max(0, room.num_children - (roomType.max_children || 0));
                          if (excessChildren > 0 && roomType.child_surcharge) {
                            childSurchargeTotal += excessChildren * (roomType.child_surcharge || 0) * nights * room.quantity;
                          }
                        }
                      });
                      
                      if (adultSurchargeTotal > 0 || childSurchargeTotal > 0) {
                        return (
                          <div style={{ marginTop: 12, padding: 12, backgroundColor: "#f0f2f5", borderRadius: 4 }}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <Text>Tiền phòng ({nights} đêm):</Text>
                                <Text strong>{baseTotal.toLocaleString("vi-VN")} VND</Text>
                              </div>
                              {adultSurchargeTotal > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text style={{ color: "#ff9800" }}>Phụ phí người lớn:</Text>
                                  <Text strong style={{ color: "#ff9800" }}>{adultSurchargeTotal.toLocaleString("vi-VN")} VND</Text>
                                </div>
                              )}
                              {childSurchargeTotal > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <Text style={{ color: "#ff9800" }}>Phụ phí trẻ em:</Text>
                                  <Text strong style={{ color: "#ff9800" }}>{childSurchargeTotal.toLocaleString("vi-VN")} VND</Text>
                                </div>
                              )}
                            </Space>
                          </div>
                        );
                      }
                      return null;
                    })()}
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

            <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
              <Space>
                {currentStep > 0 && (
                  <Button onClick={handlePrev}>
                    Quay lại
                  </Button>
                )}
                {currentStep > 0 && (
                  <Button danger onClick={handleCancelBooking}>
                    Hủy đặt phòng
                  </Button>
                )}
                {currentStep === 0 && (
                  <Button danger onClick={handleCancelBooking}>
                    Hủy đặt phòng
                  </Button>
                )}
              </Space>
              <Space>
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

