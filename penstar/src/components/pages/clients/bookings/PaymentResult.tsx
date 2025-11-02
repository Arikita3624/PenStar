import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Result, Button, Spin } from "antd";

const PaymentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [paymentStatus, setPaymentStatus] = React.useState<any>(null);
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    // Lấy query parameters từ VNPAY callback
    const queryParams = new URLSearchParams(location.search);
    const responseCode = queryParams.get("vnp_ResponseCode");
    const transactionNo = queryParams.get("vnp_TransactionNo");
    const amount = queryParams.get("vnp_Amount");
    const orderId = queryParams.get("vnp_TxnRef");

    const status = {
      responseCode,
      transactionNo,
      amount: amount ? Number(amount) / 100 : 0, // VNPAY gửi amount × 100
      orderId,
      success: responseCode === "00",
    };

    setPaymentStatus(status);
    setLoading(false);
  }, [location.search]);

  const handleGoToBookingSuccess = async () => {
    const bookingId = localStorage.getItem("bookingId");
    if (!bookingId) {
      alert("Không tìm thấy bookingId");
      return;
    }

    setUpdating(true);
    try {
      console.log("[DEBUG] Cập nhật trạng thái booking ID:", bookingId);

      // Cập nhật trạng thái booking thành "paid"
      const { updateMyBooking } = await import("@/services/bookingsApi");
      const result = await Promise.race([
        updateMyBooking(Number(bookingId), { payment_status: "paid" }),
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000) // 10s timeout
        ),
      ]);

      console.log(
        "✅ Cập nhật payment_status thành 'paid' thành công!",
        result
      );

      // Clear localStorage
      localStorage.removeItem("bookingId");

      // Redirect sang trang BookingSuccess
      navigate(`/bookings/success/${bookingId}`, { replace: true });
    } catch (err: any) {
      console.error("❌ Lỗi cập nhật trạng thái booking:", err);
      setUpdating(false);

      // Hỏi người dùng có muốn redirect sang success page hay không
      const confirmed = window.confirm(
        `Có lỗi khi cập nhật trạng thái (${err.message}). Bạn vẫn muốn xem chi tiết đơn hàng không?`
      );

      if (confirmed) {
        localStorage.removeItem("bookingId");
        navigate(`/bookings/success/${bookingId}`, { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />
      </div>
    );
  }

  return (
    <Card
      style={{ maxWidth: 600, margin: "50px auto" }}
      title="Kết quả thanh toán"
    >
      {paymentStatus?.success ? (
        <Result
          status="success"
          title="Thanh toán thành công!"
          subTitle={`
            Mã giao dịch: ${paymentStatus?.transactionNo || "N/A"}
            Số tiền: ${paymentStatus?.amount.toLocaleString("vi-VN")} VNĐ
          `}
          extra={[
            <Button
              type="primary"
              key="booking"
              onClick={handleGoToBookingSuccess}
              loading={updating}
            >
              {updating ? "Đang cập nhật..." : "Xem chi tiết đơn đặt phòng"}
            </Button>,
            <Button onClick={() => navigate("/")}>Về trang chủ</Button>,
          ]}
        />
      ) : (
        <Result
          status="error"
          title="Thanh toán thất bại"
          subTitle={`
            Mã lỗi: ${paymentStatus?.responseCode || "Unknown"}
            Vui lòng thử lại hoặc liên hệ hỗ trợ.
          `}
          extra={[
            <Button
              type="primary"
              danger
              key="retry"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>,
            <Button onClick={() => navigate("/")}>Về trang chủ</Button>,
          ]}
        />
      )}
    </Card>
  );
};

export default PaymentResult;
