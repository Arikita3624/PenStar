/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  message,
  Card,
  Typography,
  InputNumber,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { createBooking } from "@/services/bookingsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getServices } from "@/services/servicesApi";
import dayjs from "dayjs";

const BookingCreate: React.FC = () => {
  const nav = useNavigate();
  const location = useLocation();
  const method =
    new URLSearchParams(location.search).get("method") || "offline";
  const [loading, setLoading] = React.useState(false);
  const [roomTypes, setRoomTypes] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [selectedRoomType, setSelectedRoomType] = React.useState<number | null>(
    null
  );
  const [numRooms, setNumRooms] = React.useState<number>(1);
  const [checkIn, setCheckIn] = React.useState<any>(null);
  const [checkOut, setCheckOut] = React.useState<any>(null);
  const [roomServiceData, setRoomServiceData] = React.useState<any[]>([]);

  React.useEffect(() => {
    getRoomTypes().then(setRoomTypes);
    getServices().then(setServices);
  }, []);

  // Khi thay đổi số lượng phòng, khởi tạo mảng dịch vụ cho từng phòng
  React.useEffect(() => {
    setRoomServiceData(
      Array(numRooms)
        .fill(0)
        .map((_, i) => ({ service_ids: [] }))
    );
  }, [numRooms]);

  // Tính tổng tiền phòng
  const nights =
    checkIn && checkOut ? dayjs(checkOut).diff(dayjs(checkIn), "day") || 1 : 1;
  const roomTypeObj = roomTypes.find((rt: any) => rt.id === selectedRoomType);
  const totalRoomPrice = roomTypeObj
    ? (roomTypeObj.price || 0) * numRooms * nights
    : 0;
  // Tính tổng tiền dịch vụ
  const totalServicePrice = roomServiceData.reduce((sum, d) => {
    return (
      sum +
      (d.service_ids || []).reduce((acc: number, sid: number) => {
        const svc = services.find((s: any) => s.id === sid);
        return acc + Number(svc?.price || 0);
      }, 0)
    );
  }, 0);
  const totalPrice = totalRoomPrice + totalServicePrice;

  const handleServiceChange = (roomIdx: number, serviceIds: number[]) => {
    setRoomServiceData((prev) =>
      prev.map((d, i) =>
        i === roomIdx ? { ...d, service_ids: serviceIds } : d
      )
    );
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Chuẩn bị payload dạng auto-assign
      const rooms_config = [
        {
          room_type_id: selectedRoomType,
          quantity: numRooms,
          check_in: dayjs(checkIn).format("YYYY-MM-DD"),
          check_out: dayjs(checkOut).format("YYYY-MM-DD"),
          room_type_price: roomTypeObj ? (roomTypeObj.price || 0) * nights : 0,
          num_adults: 2, // Có thể bổ sung trường chọn số người lớn/trẻ em nếu cần
          num_children: 0,
        },
      ];
      const servicesPayload = roomServiceData.flatMap((d) =>
        (d.service_ids || []).map((sid: number) => {
          const svc = services.find((s: any) => s.id === sid);
          return {
            service_id: sid,
            quantity: 1,
            total_service_price: Number(svc?.price || 0),
          };
        })
      );
      const payload = {
        customer_name: values.customer_name,
        phone: values.phone,
        check_in: dayjs(checkIn).format("YYYY-MM-DD"),
        check_out: dayjs(checkOut).format("YYYY-MM-DD"),
        total_price: totalPrice,
        payment_status: values.payment_status,
        booking_method: method === "offline" ? "offline" : "online",
        stay_status_id: 1,
        rooms_config,
        services: servicesPayload,
      };
      await createBooking(payload);
      message.success(
        "Tạo booking thành công! Phòng sẽ được tự động gán ở backend."
      );
      nav("/admin/bookings");
    } catch (err) {
      message.error("Tạo booking thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Tạo booking trực tiếp</h2>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên khách hàng"
          name="customer_name"
          rules={[{ required: true, message: "Nhập tên khách hàng" }]}
        >
          {" "}
          <Input />{" "}
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{ required: true, message: "Nhập số điện thoại" }]}
        >
          {" "}
          <Input />{" "}
        </Form.Item>
        <Form.Item
          label="Ngày nhận phòng"
          name="check_in"
          rules={[{ required: true, message: "Chọn ngày nhận phòng" }]}
        >
          {" "}
          <DatePicker format="YYYY-MM-DD" onChange={setCheckIn} />{" "}
        </Form.Item>
        <Form.Item
          label="Ngày trả phòng"
          name="check_out"
          rules={[{ required: true, message: "Chọn ngày trả phòng" }]}
        >
          {" "}
          <DatePicker format="YYYY-MM-DD" onChange={setCheckOut} />{" "}
        </Form.Item>
        <Form.Item label="Kiểu phòng" required>
          <Select
            placeholder="Chọn kiểu phòng"
            value={selectedRoomType}
            onChange={setSelectedRoomType}
            style={{ width: "100%" }}
            optionFilterProp="children"
          >
            {roomTypes.map((rt: any) => (
              <Select.Option key={rt.id} value={rt.id}>
                {rt.name} - {rt.price?.toLocaleString() || 0}đ
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Số lượng phòng" required>
          <InputNumber
            min={1}
            value={numRooms}
            onChange={(v) => setNumRooms(Number(v))}
          />
        </Form.Item>
        {roomServiceData.map((d, idx) => (
          <Card
            key={idx}
            className="mb-3"
            title={`Dịch vụ cho phòng ${idx + 1}`}
          >
            <Form.Item label="Chọn dịch vụ cho phòng này">
              <Select
                mode="multiple"
                placeholder="Chọn dịch vụ"
                value={d.service_ids}
                onChange={(vals) => handleServiceChange(idx, vals)}
                style={{ width: "100%" }}
              >
                {services.map((svc: any) => (
                  <Select.Option key={svc.id} value={svc.id}>
                    {svc.name} - {svc.price?.toLocaleString() || 0}đ
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        ))}
        <Typography.Text strong>
          Tổng tiền: {totalPrice.toLocaleString()}đ
        </Typography.Text>
        <Form.Item
          label="Trạng thái thanh toán"
          name="payment_status"
          initialValue="pending"
          rules={[{ required: true }]}
        >
          {" "}
          <Select>
            <Select.Option value="pending">Chờ thanh toán</Select.Option>
            <Select.Option value="paid">Đã thanh toán</Select.Option>
          </Select>{" "}
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Tạo booking
        </Button>
      </Form>
    </div>
  );
};

export default BookingCreate;
