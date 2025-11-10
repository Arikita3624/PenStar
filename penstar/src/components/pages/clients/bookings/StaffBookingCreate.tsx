/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Space,
  message,
  Divider,
  Row,
  Col,
  Collapse,
  Table,
  Tag,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { getRooms } from "@/services/roomsApi";
import { getServices } from "@/services/servicesApi";
import { getStayStatuses } from "@/services/stayStatusApi";
import { createBooking } from "@/services/bookingsApi";
import { createPayment } from "@/services/paymentApi";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import type { StayStatus } from "@/types/stayStatus";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface RoomBookingItem {
  key: string;
  room_id: number | null;
  check_in: string;
  check_out: string;
  room_price: number;
  num_adults: number;
  num_children: number;
  guest_name: string;
  guest_phone?: string;
}

interface ServiceItem {
  service_id: number;
  quantity: number;
  total_service_price: number;
}

const StaffBookingCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();

  // Get room_id from URL if available
  const preSelectedRoomId = searchParams.get("room_id");

  // State
  const [bookingItems, setBookingItems] = useState<RoomBookingItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });

  // Queries
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: services = [] } = useQuery<Services[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const { data: stayStatuses = [] } = useQuery<StayStatus[]>({
    queryKey: ["stay_statuses"],
    queryFn: getStayStatuses,
  });

  // Mutation
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async (data: any) => {
      console.log("[StaffBookingCreate] onSuccess data:", data);
      const bookingId = data.id || data.data?.id;
      console.log("[StaffBookingCreate] bookingId:", bookingId);

      // Lấy payment method từ form
      const paymentMethodValue = form.getFieldValue("payment_method") || "cash";
      message.success("✅ Tạo booking thành công!");

      // Xử lý theo payment method
      if (paymentMethodValue === "vnpay") {
        // Redirect sang VNPay
        try {
          const paymentData = await createPayment({
            amount: data.total_price,
            language: "vn",
            returnUrl: `${window.location.origin}/payment-result`,
          });

          if (paymentData.paymentUrl) {
            localStorage.setItem("bookingId", bookingId.toString());
            window.location.href = paymentData.paymentUrl;
          } else {
            throw new Error("Không nhận được URL thanh toán");
          }
        } catch (error: any) {
          console.error("Lỗi tạo payment URL:", error);
          message.error("Lỗi chuyển sang trang thanh toán");
          // Fallback: navigate to success
          navigate(`/bookings/success/${bookingId}`);
        }
      } else {
        // Cash/COD - navigate to success luôn
        navigate(`/bookings/success/${bookingId}`);
      }
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        "Tạo booking thất bại";
      message.error(errorMsg);
      console.error("Booking error:", error);
    },
  });

  // Available rooms (only status = 'available')
  const availableRooms = rooms.filter((r) => r.status === "available");

  // Auto-add room if room_id is in URL
  React.useEffect(() => {
    if (preSelectedRoomId && rooms.length > 0 && bookingItems.length === 0) {
      const roomId = Number(preSelectedRoomId);
      const room = rooms.find((r) => r.id === roomId);
      if (room && room.status === "available") {
        const newItem: RoomBookingItem = {
          key: Date.now().toString(),
          room_id: roomId,
          check_in: "",
          check_out: "",
          room_price: 0,
          num_adults: 1,
          num_children: 0,
          guest_name: customerInfo.customer_name || "",
          guest_phone: customerInfo.customer_phone || "",
        };
        setBookingItems([newItem]);
      }
    }
  }, [preSelectedRoomId, rooms, bookingItems.length, customerInfo]);

  // Helper functions
  const calculateNights = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));
    return nights;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Add room booking
  const handleAddRoom = () => {
    const newItem: RoomBookingItem = {
      key: Date.now().toString(),
      room_id: null,
      check_in: "",
      check_out: "",
      room_price: 0,
      num_adults: 1,
      num_children: 0,
      guest_name: customerInfo.customer_name || "",
      guest_phone: customerInfo.customer_phone || "",
    };
    setBookingItems([...bookingItems, newItem]);
  };

  const handleRemoveRoom = (key: string) => {
    setBookingItems(bookingItems.filter((item) => item.key !== key));
  };

  const handleUpdateRoomItem = (
    key: string,
    field: keyof RoomBookingItem,
    value: any
  ) => {
    setBookingItems(
      bookingItems.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };

          // Auto-calculate room_price when room or dates change
          if (
            field === "room_id" ||
            field === "check_in" ||
            field === "check_out"
          ) {
            const room = rooms.find((r) => r.id === updated.room_id);
            if (room && updated.check_in && updated.check_out) {
              const nights = calculateNights(
                updated.check_in,
                updated.check_out
              );
              updated.room_price = room.price * nights;
            }
          }

          return updated;
        }
        return item;
      })
    );
  };

  const handleDateRangeChange = (
    key: string,
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      const checkIn = dates[0].format("YYYY-MM-DD");
      const checkOut = dates[1].format("YYYY-MM-DD");

      // Update both check_in and check_out
      setBookingItems(
        bookingItems.map((item) => {
          if (item.key === key) {
            const updated = { ...item, check_in: checkIn, check_out: checkOut };

            // Auto-calculate room_price
            const room = rooms.find((r) => r.id === updated.room_id);
            if (room && updated.check_in && updated.check_out) {
              const nights = calculateNights(
                updated.check_in,
                updated.check_out
              );
              updated.room_price = room.price * nights;
            }

            return updated;
          }
          return item;
        })
      );
    }
  };

  // Add service
  const handleAddService = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const existing = serviceItems.find((s) => s.service_id === serviceId);
    if (existing) {
      message.warning("Dịch vụ đã được thêm");
      return;
    }

    setServiceItems([
      ...serviceItems,
      {
        service_id: serviceId,
        quantity: 1,
        total_service_price: service.price,
      },
    ]);
  };

  const handleRemoveService = (serviceId: number) => {
    setServiceItems(serviceItems.filter((s) => s.service_id !== serviceId));
  };

  const handleUpdateServiceQuantity = (serviceId: number, quantity: number) => {
    setServiceItems(
      serviceItems.map((s) => {
        if (s.service_id === serviceId) {
          const service = services.find((sv) => sv.id === serviceId);
          return {
            ...s,
            quantity,
            total_service_price: service ? service.price * quantity : 0,
          };
        }
        return s;
      })
    );
  };

  // Calculate totals
  const totalRoomPrice = bookingItems.reduce(
    (sum, item) => sum + (Number(item.room_price) || 0),
    0
  );
  const totalServicePrice = serviceItems.reduce(
    (sum, item) => sum + (Number(item.total_service_price) || 0),
    0
  );
  const totalAmount = totalRoomPrice + totalServicePrice;

  // Submit booking
  const handleSubmit = async (values: any) => {
    try {
      // Validation
      if (!customerInfo.customer_name.trim()) {
        message.error("Vui lòng nhập tên khách hàng");
        return;
      }
      if (!customerInfo.customer_phone.trim()) {
        message.error("Vui lòng nhập số điện thoại khách hàng");
        return;
      }
      if (bookingItems.length === 0) {
        message.error("Vui lòng thêm ít nhất 1 phòng");
        return;
      }

      // Validate each room
      for (let i = 0; i < bookingItems.length; i++) {
        const item = bookingItems[i];
        if (!item.room_id) {
          message.error(`Phòng ${i + 1}: Vui lòng chọn phòng`);
          return;
        }
        if (!item.check_in || !item.check_out) {
          message.error(
            `Phòng ${i + 1}: Vui lòng chọn ngày check-in/check-out`
          );
          return;
        }

        // Check capacity
        const room = rooms.find((r) => r.id === item.room_id);
        if (room) {
          const numAdults = item.num_adults || 0;
          const numChildren = item.num_children || 0;
          const totalGuests = numAdults + numChildren;

          // Kiểm tra tổng số người
          if (totalGuests > room.capacity) {
            message.error(
              `Phòng ${i + 1} (${
                room.name
              }): Tổng số người (${totalGuests}) vượt quá sức chứa (${
                room.capacity
              })`
            );
            return;
          }

          // Kiểm tra số người lớn tối đa (nếu có giới hạn)
          if (room.max_adults && numAdults > room.max_adults) {
            message.error(
              `Phòng ${i + 1} (${
                room.name
              }): Số người lớn (${numAdults}) vượt quá giới hạn (${
                room.max_adults
              })`
            );
            return;
          }

          // Kiểm tra số trẻ em tối đa (nếu có giới hạn)
          if (room.max_children && numChildren > room.max_children) {
            message.error(
              `Phòng ${i + 1} (${
                room.name
              }): Số trẻ em (${numChildren}) vượt quá giới hạn (${
                room.max_children
              })`
            );
            return;
          }

          if (totalGuests === 0) {
            message.error(`Phòng ${i + 1}: Phải có ít nhất 1 người`);
            return;
          }
        }
      }

      // Get stay_status_id (default: pending = 6 or reserved = 1)
      const pendingStatus = stayStatuses.find((s) => s.id === 6);
      const reservedStatus = stayStatuses.find((s) => s.id === 1);
      const stayStatusId = pendingStatus?.id || reservedStatus?.id || 1;

      // Build booking payload
      const bookingPayload = {
        customer_name: customerInfo.customer_name,
        email: customerInfo.customer_email || undefined,
        phone: customerInfo.customer_phone || undefined,
        total_price: totalAmount,
        payment_status:
          values.payment_method === "vnpay" ? "unpaid" : "pending",
        payment_method: values.payment_method || "cash",
        booking_method: "offline", // Staff booking = offline/walk-in
        stay_status_id: values.stay_status_id || stayStatusId,
        notes: values.notes || "",
        items: bookingItems.map((item) => ({
          room_id: item.room_id!,
          check_in: item.check_in,
          check_out: item.check_out,
          room_price: item.room_price,
          num_adults: item.num_adults || 1,
          num_children: item.num_children || 0,
        })),
        services:
          serviceItems.length > 0
            ? serviceItems.map((s) => ({
                service_id: s.service_id,
                quantity: s.quantity,
                total_service_price: s.total_service_price,
              }))
            : undefined,
      };

      console.log("Staff booking payload:", bookingPayload);
      createBookingMutation.mutate(bookingPayload as any);
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Có lỗi xảy ra khi tạo booking");
    }
  };

  return (
    <div className="p-6">
      <Card title="🏨 Tạo Booking cho Khách Walk-in" className="shadow-lg">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Customer Information */}
          <Card type="inner" title="👤 Thông tin khách hàng" className="mb-4">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Họ tên khách hàng" required>
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
              </Col>
              <Col span={8}>
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
              </Col>
              <Col span={8}>
                <Form.Item label="Email">
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
              </Col>
            </Row>
          </Card>

          {/* Room Bookings */}
          <Card
            type="inner"
            title="🛏️ Danh sách phòng đặt"
            className="mb-4"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRoom}
              >
                Thêm phòng
              </Button>
            }
          >
            {bookingItems.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Chưa có phòng nào. Nhấn "Thêm phòng" để bắt đầu.
              </div>
            ) : (
              <Collapse accordion>
                {bookingItems.map((item, index) => {
                  const room = rooms.find((r) => r.id === item.room_id);
                  return (
                    <Panel
                      header={
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">
                            Phòng {index + 1}: {room ? room.name : "Chưa chọn"}
                          </span>
                          <Space>
                            <Tag color="blue">
                              {formatPrice(item.room_price)}
                            </Tag>
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRoom(item.key);
                              }}
                            >
                              Xóa
                            </Button>
                          </Space>
                        </div>
                      }
                      key={item.key}
                    >
                      <Row gutter={16}>
                        {/* Room Image */}
                        {room && room.thumbnail && (
                          <Col span={24} className="mb-4">
                            <img
                              src={room.thumbnail}
                              alt={room.name}
                              style={{
                                width: "100%",
                                maxHeight: "200px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                          </Col>
                        )}
                        <Col span={12}>
                          <Form.Item label="Chọn phòng" required>
                            <Select
                              placeholder="Chọn phòng"
                              value={item.room_id || undefined}
                              onChange={(val) =>
                                handleUpdateRoomItem(item.key, "room_id", val)
                              }
                              showSearch
                              optionFilterProp="children"
                            >
                              {availableRooms.map((r) => (
                                <Select.Option key={r.id} value={r.id}>
                                  {r.name} - {formatPrice(r.price)}/đêm (Sức
                                  chứa: {r.capacity})
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Ngày check-in / check-out" required>
                            <RangePicker
                              className="w-full"
                              value={
                                item.check_in && item.check_out
                                  ? [
                                      dayjs(item.check_in),
                                      dayjs(item.check_out),
                                    ]
                                  : null
                              }
                              onChange={(dates) =>
                                handleDateRangeChange(item.key, dates as any)
                              }
                              format="YYYY-MM-DD"
                              disabledDate={(current) => {
                                // Disable ngày hôm nay và tất cả ngày quá khứ
                                return (
                                  current && current < dayjs().endOf("day")
                                );
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            label="Người lớn"
                            required
                            help={
                              room?.max_adults
                                ? `Tối đa: ${room.max_adults} người lớn`
                                : undefined
                            }
                          >
                            <InputNumber
                              min={1}
                              max={
                                room
                                  ? Math.min(
                                      room.max_adults || 999,
                                      room.capacity - (item.num_children || 0)
                                    )
                                  : 20
                              }
                              value={item.num_adults}
                              onChange={(val) => {
                                if (!room) return;

                                const newAdults = val || 1;
                                const currentChildren = item.num_children || 0;
                                const totalGuests = newAdults + currentChildren;

                                // Kiểm tra tổng không vượt capacity
                                if (totalGuests > room.capacity) {
                                  message.warning(
                                    `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${room.capacity})`
                                  );
                                  return;
                                }

                                // Kiểm tra max_adults
                                if (
                                  room.max_adults &&
                                  newAdults > room.max_adults
                                ) {
                                  message.warning(
                                    `Số người lớn vượt quá giới hạn (${room.max_adults})`
                                  );
                                  return;
                                }

                                handleUpdateRoomItem(
                                  item.key,
                                  "num_adults",
                                  newAdults
                                );
                              }}
                              className="w-full"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            label="Trẻ em"
                            help={
                              room?.max_children
                                ? `Tối đa: ${room.max_children} trẻ em`
                                : undefined
                            }
                          >
                            <InputNumber
                              min={0}
                              max={
                                room
                                  ? Math.min(
                                      room.max_children || 999,
                                      room.capacity - (item.num_adults || 1)
                                    )
                                  : 20
                              }
                              value={item.num_children}
                              onChange={(val) => {
                                if (!room) return;

                                const newChildren = val || 0;
                                const currentAdults = item.num_adults || 1;
                                const totalGuests = currentAdults + newChildren;

                                // Kiểm tra tổng không vượt capacity
                                if (totalGuests > room.capacity) {
                                  message.warning(
                                    `Tổng số người (${totalGuests}) vượt quá sức chứa phòng (${room.capacity})`
                                  );
                                  return;
                                }

                                // Kiểm tra max_children
                                if (
                                  room.max_children &&
                                  newChildren > room.max_children
                                ) {
                                  message.warning(
                                    `Số trẻ em vượt quá giới hạn (${room.max_children})`
                                  );
                                  return;
                                }

                                handleUpdateRoomItem(
                                  item.key,
                                  "num_children",
                                  newChildren
                                );
                              }}
                              className="w-full"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label="Giá phòng (tự động tính)">
                            <Input
                              value={formatPrice(item.room_price)}
                              disabled
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Panel>
                  );
                })}
              </Collapse>
            )}
          </Card>

          {/* Services */}
          <Card
            type="inner"
            title="🍴 Dịch vụ thêm"
            className="mb-4"
            extra={
              <Select
                placeholder="Chọn dịch vụ để thêm"
                style={{ width: 250 }}
                onChange={(val) => {
                  if (val) handleAddService(val);
                }}
                value={undefined}
              >
                {services.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name} - {formatPrice(s.price)}
                  </Select.Option>
                ))}
              </Select>
            }
          >
            {serviceItems.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                Chưa có dịch vụ nào
              </div>
            ) : (
              <Table
                dataSource={serviceItems}
                rowKey="service_id"
                pagination={false}
                columns={[
                  {
                    title: "Dịch vụ",
                    dataIndex: "service_id",
                    render: (id) =>
                      services.find((s) => s.id === id)?.name || "N/A",
                  },
                  {
                    title: "Đơn giá",
                    dataIndex: "service_id",
                    render: (id) => {
                      const service = services.find((s) => s.id === id);
                      return formatPrice(service?.price || 0);
                    },
                  },
                  {
                    title: "Số lượng",
                    dataIndex: "quantity",
                    render: (qty, record) => (
                      <InputNumber
                        min={1}
                        value={qty}
                        onChange={(val) =>
                          handleUpdateServiceQuantity(
                            record.service_id,
                            val || 1
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: "Thành tiền",
                    dataIndex: "total_service_price",
                    render: (price) => formatPrice(price),
                  },
                  {
                    title: "Hành động",
                    render: (_, record) => (
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveService(record.service_id)}
                      >
                        Xóa
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </Card>

          {/* Payment */}
          <Card type="inner" title="💳 Phương thức thanh toán" className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payment_method"
                  label="Phương thức thanh toán"
                  initialValue="cash"
                  required
                >
                  <Select>
                    <Select.Option value="cash">Tiền mặt</Select.Option>
                    <Select.Option value="vnpay">VNPay</Select.Option>
                    <Select.Option value="momo">MoMo</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="notes" label="Ghi chú">
                  <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Summary */}
          <Card type="inner" title="📊 Tổng kết" className="mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>Tổng tiền phòng:</span>
                <span className="font-bold text-blue-600">
                  {formatPrice(totalRoomPrice)}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Tổng tiền dịch vụ:</span>
                <span className="font-bold text-green-600">
                  {formatPrice(totalServicePrice)}
                </span>
              </div>
              <Divider />
              <div className="flex justify-between text-2xl">
                <span className="font-bold">TỔNG CỘNG:</span>
                <span className="font-bold text-red-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => navigate("/admin/bookings")}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createBookingMutation.isPending}
                size="large"
              >
                Tạo Booking
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffBookingCreate;
