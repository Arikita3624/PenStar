import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  DatePicker,
  Button,
  InputNumber,
  List,
  message,
  Spin,
  Form,
  Input,
  Row,
  Col,
} from "antd";
import { getRoomID } from "@/services/roomsApi";
import { getServices } from "@/services/servicesApi";
import { createBooking } from "@/services/bookingsApi";
import type { Room } from "@/types/room";
import type { Services } from "@/types/services";
import type { Booking, BookingItem, BookingService } from "@/types/bookings";
import dayjs from "dayjs";
import useAuth from "@/hooks/useAuth";

const { RangePicker } = DatePicker;

const BookingCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth() as {
    user: { id: number; full_name: string; email: string; phone: string };
  };
  const roomId = Number(searchParams.get("room_id") || 0);

  const [room, setRoom] = useState<Room | null>(null);
  const [services, setServices] = useState<Services[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [serviceQuantities, setServiceQuantities] = useState<
    Record<number, number>
  >({});
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        customer_name: user.full_name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const roomData = await getRoomID(roomId);

        // Check room availability status
        if (roomData.status !== "available") {
          message.error(
            `Phòng này đang ở trạng thái "${roomData.status}" và không thể đặt. Vui lòng chọn phòng khác.`
          );
          navigate("/rooms");
          return;
        }

        const servicesData = await getServices();
        setRoom(roomData);
        setServices(servicesData);
      } catch (err) {
        console.error(err);
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    if (roomId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [roomId, navigate]);

  const onFinish = async (values: {
    customer_name: string;
    email: string;
    phone: string;
  }) => {
    if (!dates || dates.length !== 2) {
      message.error("Please select check-in and check-out dates");
      return;
    }
    if (!room) {
      message.error("Room data is not loaded");
      return;
    }
    if (!user || !user.id) {
      message.error("You must be logged in to create a booking");
      return;
    }

    const check_in = dayjs(dates[0]).format("YYYY-MM-DD");
    const check_out = dayjs(dates[1]).format("YYYY-MM-DD");

    // Calculate number of nights
    const nights = Math.ceil(
      (dates[1].toDate().getTime() - dates[0].toDate().getTime()) /
        (1000 * 3600 * 24)
    );

    const bookingItems: BookingItem[] = [
      {
        room_id: roomId,
        check_in,
        check_out,
        room_price: room.price * nights, // Multiply by number of nights
      },
    ];

    const bookingServices: BookingService[] = Object.entries(serviceQuantities)
      .map(([serviceId, quantity]) => {
        const service = services.find((s) => s.id === Number(serviceId));
        if (!service || quantity <= 0) return null;
        return {
          service_id: Number(serviceId),
          quantity,
          total_service_price: quantity * service.price,
        };
      })
      .filter((s): s is BookingService => s !== null);

    const totalRoomPrice = bookingItems.reduce(
      (acc, item) => acc + item.room_price,
      0
    );
    const totalServicePrice = bookingServices.reduce(
      (acc, item) => acc + item.total_service_price,
      0
    );

    const bookingData: Booking = {
      ...values,
      user_id: user?.id,
      total_price: totalRoomPrice + totalServicePrice,
      payment_status: "pending",
      booking_method: "COD",
      stay_status_id: 6,
      items: bookingItems,
      services: bookingServices,
    };

    try {
      const newBooking = await createBooking(bookingData);
      message.success("Đặt phòng thành công! Chờ admin xác nhận.");
      navigate(`/bookings/success/${newBooking.id}`);
    } catch (error: unknown) {
      console.error("Booking creation failed:", error);

      let errorMessage = "Không thể đặt phòng. Vui lòng thử lại.";

      if (typeof error === "object" && error !== null && "response" in error) {
        const response = (
          error as {
            response?: { data?: { message?: string }; status?: number };
          }
        ).response;

        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.status === 409) {
          errorMessage =
            "Phòng đã được đặt trong thời gian này. Vui lòng chọn phòng khác hoặc thời gian khác.";
        } else if (response?.status === 400) {
          errorMessage =
            "Thông tin đặt phòng không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (response?.status === 500) {
          errorMessage = "Lỗi hệ thống. Vui lòng liên hệ quản trị viên.";
        }
      }

      message.error(errorMessage, 4); // Hiển thị 4 giây
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center">
        <Spin />
      </div>
    );
  if (!room) return <div className="p-8 text-center">Room not found</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card title={`Book Room: ${room.name}`}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer_name" label="Full Name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Booking Dates" required>
                <RangePicker
                  className="w-full"
                  onChange={(vals) =>
                    setDates(vals as [dayjs.Dayjs, dayjs.Dayjs])
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-4">
            <h3>Additional Services</h3>
            <List
              dataSource={services}
              renderItem={(service) => (
                <List.Item>
                  <div className="w-full flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{service.name}</div>
                      <div className="text-sm">{service.price} VND</div>
                    </div>
                    <InputNumber
                      min={0}
                      value={serviceQuantities[service.id] || 0}
                      onChange={(value) =>
                        setServiceQuantities((prev) => ({
                          ...prev,
                          [service.id]: value || 0,
                        }))
                      }
                    />
                  </div>
                </List.Item>
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate(-1)}>Back</Button>
            <Button type="primary" htmlType="submit">
              Confirm Booking
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default BookingCreate;
