/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, Radio, Button, Space, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

const paymentMethods = [
  { value: "vnpay", label: "VNPAY" },
  { value: "momo", label: "MoMo" },
];

const PaymentMethodSelect: React.FC = () => {
  const [method, setMethod] = React.useState<string>("vnpay");
  const [bookingInfo, setBookingInfo] = React.useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // bookingId lấy từ state hoặc query
  const bookingId = location.state?.bookingId;
  const initialBookingInfo = location.state?.bookingInfo;

  React.useEffect(() => {
    if (!bookingId) {
      alert("Không tìm thấy thông tin booking. Vui lòng đặt phòng lại.");
      navigate("/rooms");
      return;
    }
    // Nếu bookingInfo chưa có hoặc thiếu total_price thì gọi API lấy chi tiết booking
    if (!initialBookingInfo || !initialBookingInfo.total_price) {
      // import động để tránh lỗi SSR
      import("@/services/bookingsApi").then(({ getBookingById }) => {
        getBookingById(Number(bookingId))
          .then((data) => {
            setBookingInfo(data);
          })
          .catch(() => {
            alert("Không lấy được thông tin booking. Vui lòng thử lại.");
            navigate("/rooms");
          });
      });
    } else {
      setBookingInfo(initialBookingInfo);
    }
  }, [bookingId, initialBookingInfo, navigate]);

  const handleConfirm = async () => {
    if (!bookingId || !bookingInfo) {
      alert("Không tìm thấy thông tin booking. Vui lòng đặt phòng lại.");
      return;
    }
    try {
      // Chuyển đổi số tiền về số nguyên (loại bỏ dấu chấm, ký tự đặc biệt)
      let totalPrice = bookingInfo?.total_price;
      if (typeof totalPrice === "string") {
        totalPrice = totalPrice.replace(/[^\d]/g, "");
      }
      totalPrice = Number(totalPrice);
      // Kiểm tra số tiền hợp lệ trước khi gọi VNPAY
      if (method === "vnpay") {
        if (isNaN(totalPrice) || totalPrice < 5000 || totalPrice > 1000000000) {
          alert(
            "Số tiền không hợp lệ. Số tiền phải từ 5,000 đến dưới 1 tỷ VNĐ."
          );
          return;
        }
      }
      // Gọi API cập nhật phương thức thanh toán cho booking
      const { updateMyBooking } = await import("@/services/bookingsApi");
      await updateMyBooking(bookingId, { payment_method: method });
      if (method === "vnpay") {
        // Lưu bookingId vào localStorage để PaymentResult callback có thể lấy
        localStorage.setItem("bookingId", bookingId.toString());

        const res = await fetch(
          `http://localhost:5000/api/payment/create_payment?amount=${totalPrice}`
        );
        const data = await res.json();
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          navigate(`/bookings/success/${bookingId}`, {
            state: { bookingId, bookingInfo, method },
          });
        }
      } else {
        navigate(`/bookings/success/${bookingId}`, {
          state: { bookingId, bookingInfo, method },
        });
      }
    } catch (err) {
      // Xử lý lỗi
      console.error("Update payment method failed", err);
    }
  };

  return (
    <Card
      title="Chọn phương thức thanh toán"
      style={{ maxWidth: 480, margin: "32px auto" }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Radio.Group
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ width: "100%" }}
        >
          {paymentMethods.map((pm) => (
            <Radio
              key={pm.value}
              value={pm.value}
              style={{ display: "block", width: "100%" }}
            >
              {pm.label}
            </Radio>
          ))}
        </Radio.Group>

        <div>
          <Typography.Text strong>Tổng tiền: </Typography.Text>
          <Typography.Text>
            {bookingInfo?.total_price ?? "Đang tải..."}
          </Typography.Text>
        </div>

        <Button type="primary" onClick={handleConfirm} disabled={!bookingInfo}>
          Xác nhận và thanh toán
        </Button>
      </Space>
    </Card>
  );
};

export default PaymentMethodSelect;
