/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Select,
  Checkbox,
  Row,
  Col,
  Divider,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { createBooking } from "@/services/bookingsApi";
import { createPayment, createMoMoPayment } from "@/services/paymentApi";
import { useMutation } from "@tanstack/react-query";
import useAuth from "@/hooks/useAuth";

const { TextArea } = Input;
const { Option } = Select;

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const auth = useAuth();
  const user = auth?.user;

  // Dữ liệu từ RoomSearchResults
  const {
    searchParams,
    items = [],
    totalPrice: totalPriceFromState,
  } = location.state || {};

  const [customerInfo, setCustomerInfo] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });
  const [notes, setNotes] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("vnpay");

  // Auto-fill user info
  useEffect(() => {
    if (user) {
      const data = {
        customer_name: user.full_name || "",
        customer_email: user.email || "",
        customer_phone: user.phone || "",
      };
      form.setFieldsValue(data);
      setCustomerInfo(data);
    }
  }, [user, form]);

  // Tính số đêm
  const nights = useMemo(() => {
    if (!searchParams?.check_in || !searchParams?.check_out) return 1;
    const diff =
      new Date(searchParams.check_out).getTime() -
      new Date(searchParams.check_in).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [searchParams]);

  // Tính tổng tiền phòng - ưu tiên dùng totalPrice từ state
  const totalRoomPrice = useMemo(() => {
    // Nếu có totalPrice từ state (đã tính đúng phụ phí), dùng luôn
    if (totalPriceFromState) {
      return totalPriceFromState;
    }
    // Fallback: tính lại nếu không có
    return items.reduce((sum: number, item: any) => {
      const pricePerNight =
        Number(item.base_price || item.room_type_price) +
        Number(item.extra_fees || 0);
      return sum + pricePerNight * nights;
    }, 0);
  }, [items, nights, totalPriceFromState]);

  // Format giá
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Mutation create booking
  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: async (res: any) => {
      const bookingId = res?.id || res?.data?.id;
      const booking = res?.data || res;

      // Nếu chọn cash (tiền mặt), chuyển thẳng sang success
      if (paymentMethod === "cash") {
        message.success(
          "Đặt phòng thành công! Vui lòng thanh toán khi nhận phòng."
        );
        navigate(`/bookings/success/${bookingId}`, {
          state: { booking },
        });
        return;
      }

      // Nếu chọn online payment (vnpay/momo), tạo payment URL
      try {
        let paymentUrl = "";
        const paymentParams = {
          bookingId: bookingId,
          amount: totalRoomPrice,
          orderInfo: `Thanh toán đặt phòng #${bookingId}`,
        };

        if (paymentMethod === "vnpay") {
          const paymentRes = await createPayment(paymentParams);
          paymentUrl = paymentRes.paymentUrl || paymentRes.data?.paymentUrl;
        } else if (paymentMethod === "momo") {
          const paymentRes = await createMoMoPayment(paymentParams);
          paymentUrl = paymentRes.paymentUrl || paymentRes.data?.paymentUrl;
        }

        if (paymentUrl) {
          message.success("Đang chuyển đến trang thanh toán...");
          // Lưu bookingId vào localStorage để PaymentResult có thể lấy
          localStorage.setItem("bookingId", bookingId.toString());
          localStorage.setItem("bookingInfo", JSON.stringify(booking));
          // Redirect to payment gateway
          window.location.href = paymentUrl;
        } else {
          throw new Error("Không nhận được URL thanh toán");
        }
      } catch (paymentError: any) {
        console.error("Payment error:", paymentError);
        message.error("Lỗi khi tạo thanh toán. Vui lòng thử lại.");
        // Fallback: chuyển sang PaymentMethodSelect
        navigate("/bookings/payment-method", {
          state: { bookingId, bookingInfo: booking },
        });
      }
    },
    onError: (err: any) => {
      console.error("Booking error:", err);
      message.error(err?.response?.data?.message || "Đặt phòng thất bại");
    },
  });

  // Submit form
  const handleSubmit = () => {
    if (!customerInfo.customer_name?.trim()) {
      return message.error("Vui lòng nhập họ tên");
    }
    if (!customerInfo.customer_phone?.trim()) {
      return message.error("Vui lòng nhập số điện thoại");
    }
    if (!customerInfo.customer_email?.trim()) {
      return message.error("Vui lòng nhập email");
    }
    if (!agreePolicy) {
      return message.error("Vui lòng đồng ý với chính sách đặt phòng");
    }

    // Group items theo room_type_id để tạo rooms_config cho backend
    const roomsConfigMap: Record<string, any> = {};

    items.forEach((item: any) => {
      const key = `${item.room_type_id}-${item.num_adults}-${item.num_children}`;
      if (!roomsConfigMap[key]) {
        roomsConfigMap[key] = {
          room_type_id: item.room_type_id,
          quantity: 0,
          check_in: searchParams.check_in,
          check_out: searchParams.check_out,
          room_type_price: Number(item.room_type_price) * nights,
          num_adults: item.num_adults,
          num_children: item.num_children,
        };
      }
      roomsConfigMap[key].quantity += 1;
    });

    const payload = {
      customer_name: customerInfo.customer_name,
      customer_email: customerInfo.customer_email,
      customer_phone: customerInfo.customer_phone,
      notes: notes || undefined,
      promo_code: searchParams?.promo_code || undefined,
      total_price: totalRoomPrice,
      payment_status: "unpaid",
      payment_method: paymentMethod,
      booking_method: "online",
      stay_status_id: 6, // pending
      rooms_config: Object.values(roomsConfigMap),
    };

    console.log("📤 Payload gửi backend:", payload);
    createBookingMutation.mutate(payload as any);
  };

  if (!searchParams || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <p>Không có thông tin đặt phòng. Vui lòng quay lại trang tìm kiếm.</p>
          <Button type="primary" onClick={() => navigate("/")}>
            Quay về trang chủ
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="text"
          >
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-center mt-2">
            THÔNG TIN ĐẶT PHÒNG
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Row gutter={24}>
          {/* Left Column - Form */}
          <Col xs={24} lg={14}>
            <Card title="Thông tin người đặt phòng">
              <Form form={form} layout="vertical">
                <Form.Item label="Tên" required>
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập họ và tên"
                    value={customerInfo.customer_name}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item label="Email" required>
                  <Input
                    prefix={<MailOutlined />}
                    type="email"
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

                <Form.Item label="Số điện thoại" required>
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="+84 - 987 654 321"
                    value={customerInfo.customer_phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        customer_phone: e.target.value,
                      })
                    }
                  />
                </Form.Item>

                <Form.Item label="Yêu cầu thêm">
                  <TextArea
                    rows={4}
                    placeholder="Ví dụ: Số tầng, Giường đơn hay Giường đôi cho bạn hoặc kích cỡ giường, đệm thêm hoặc nệm khách..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Item>
              </Form>
            </Card>

            {/* Chính sách */}
            <Card title="Chính sách đặt phòng" className="mt-4">
              <div className="space-y-2 text-sm">
                <p>
                  ✓ Hãy đảm bảo thông tin chính xác, nhất là số điện
                  thoại/email.
                </p>
                <p>
                  ✓ Thanh toán: Thanh toán toàn bộ tiền đặt phòng khi chọn nhận
                  phòng.
                </p>
                <p>✓ Không hoàn tiền khi hủy đặt phòng.</p>
                <p>✓ Đã bao gồm ăn sáng.</p>
              </div>
            </Card>

            {/* Payment Method */}
            <Card title="Phương thức thanh toán" className="mt-4">
              <Select
                value={paymentMethod}
                onChange={setPaymentMethod}
                style={{ width: "100%" }}
              >
                <Option value="vnpay">
                  <div className="flex items-center">
                    <span className="mr-2">💳</span> VNPay (Thẻ ATM)
                  </div>
                </Option>
                <Option value="momo">MoMo</Option>
                <Option value="cash">Tiền mặt khi nhận phòng</Option>
              </Select>
            </Card>
          </Col>

          {/* Right Column - Booking Summary */}
          <Col xs={24} lg={10}>
            <Card title="Yêu cầu đặt phòng của bạn" className="sticky top-4">
              <div className="space-y-4">
                {/* Hotel Info */}
                <div>
                  <h3 className="font-bold text-lg">PenStar Luxury Hotel</h3>
                  <p className="text-sm text-gray-600">
                    Nhận phòng: {searchParams.check_in}
                  </p>
                  <p className="text-sm text-gray-600">
                    Trả phòng: {searchParams.check_out} cho đến 12:00
                  </p>
                  <p className="text-sm text-gray-600">
                    ({nights} đêm | {items.length} phòng)
                  </p>
                </div>

                <Divider />

                {/* Room Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Thông tin phòng:</h4>
                  {items.map((item: any, idx: number) => {
                    const basePrice =
                      Number(item.base_price || item.room_type_price) * nights;
                    const extraAdultFees =
                      Number(item.extra_adult_fees || 0) * nights;
                    const extraChildFees =
                      Number(item.extra_child_fees || 0) * nights;
                    const totalExtraFees = extraAdultFees + extraChildFees;
                    const totalPerRoom = basePrice + totalExtraFees;

                    return (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">
                          Phòng {idx + 1}:{" "}
                          {item.room_type_name || "Phòng Deluxe"}
                        </p>

                        {/* Thông tin khách */}
                        <p className="text-sm text-gray-600 mt-1">
                          Dành cho {item.num_adults} Người lớn -{" "}
                          {item.num_children} Trẻ em
                          {item.num_babies > 0 && ` - ${item.num_babies} Em bé`}
                        </p>

                        {/* Chi tiết phụ phí */}
                        {(extraAdultFees > 0 || extraChildFees > 0) && (
                          <div className="mt-2 space-y-1">
                            {extraAdultFees > 0 && (
                              <p className="text-sm text-orange-600">
                                Phụ thu người lớn:{" "}
                                {formatPrice(extraAdultFees / nights)} VND /đêm
                              </p>
                            )}
                            {extraChildFees > 0 && (
                              <p className="text-sm text-orange-600">
                                Phụ thu trẻ em:{" "}
                                {formatPrice(extraChildFees / nights)} VND /đêm
                              </p>
                            )}
                          </div>
                        )}

                        {/* Giá phòng */}
                        <p className="text-sm text-gray-700 mt-2">
                          Giá phòng: {formatPrice(basePrice)}
                        </p>

                        {/* Tổng */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
                          <span className="font-semibold text-base">Tổng:</span>
                          <span className="font-bold text-lg">
                            {formatPrice(totalPerRoom)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider />

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Giá phòng:</span>
                    <span className="font-semibold">
                      {formatPrice(totalRoomPrice)}
                    </span>
                  </div>
                  {searchParams.promo_code && (
                    <div className="flex justify-between text-green-600">
                      <span>Mã khuyến mãi:</span>
                      <span className="font-semibold">
                        {searchParams.promo_code}
                      </span>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Tổng giá:</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {formatPrice(totalRoomPrice)}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  Bao gồm tất cả các loại thuế. Quý khách vui lòng thanh toán
                  theo giá VND.
                </p>

                <Divider />

                {/* Checkbox đồng ý */}
                <Checkbox
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                >
                  Vui lòng đọc kỹ và đồng ý với điều khoản đặt phòng của khách
                  sạn, vào ô bên cạnh để xác nhận đặt phòng.
                </Checkbox>

                {/* Nút thực hiện */}
                <Button
                  type="primary"
                  size="large"
                  block
                  className="mt-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    border: "none",
                    height: "48px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                  onClick={handleSubmit}
                  loading={createBookingMutation.isPending}
                >
                  THỰC HIỆN ĐẶT PHÒNG
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default BookingConfirm;
