/* eslint-disable @typescript-eslint/no-explicit-any */
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-6">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Compact */}
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
              Kết quả thanh toán
            </h1>
          </div>
        </div>

        <Card
          className="rounded-xl overflow-hidden border-0"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          {paymentStatus?.success ? (
            <Result
              status="success"
              title={
                <span className="text-lg font-bold">
                  Thanh toán thành công!
                </span>
              }
              subTitle={
                <div className="space-y-1 mt-2">
                  <p className="text-sm">
                    <strong>Mã giao dịch:</strong>{" "}
                    {paymentStatus?.transactionNo || "N/A"}
                  </p>
                  <p className="text-sm">
                    <strong>Số tiền:</strong>{" "}
                    <span className="text-red-600 font-bold text-base">
                      {paymentStatus?.amount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </p>
                </div>
              }
              extra={[
                <Button
                  type="primary"
                  key="booking"
                  onClick={handleGoToBookingSuccess}
                  loading={updating}
                  size="middle"
                  style={{
                    background:
                      "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                    borderColor: "transparent",
                  }}
                >
                  {updating ? "Đang cập nhật..." : "Xem chi tiết đơn đặt phòng"}
                </Button>,
                <Button onClick={() => navigate("/")} size="middle">
                  Về trang chủ
                </Button>,
              ]}
            />
          ) : (
            <Result
              status="error"
              title={
                <span className="text-lg font-bold">Thanh toán thất bại</span>
              }
              subTitle={
                <div className="space-y-1 mt-2">
                  <p className="text-sm">
                    <strong>Mã lỗi:</strong>{" "}
                    {paymentStatus?.responseCode || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vui lòng thử lại hoặc liên hệ hỗ trợ.
                  </p>
                </div>
              }
              extra={[
                <Button
                  type="primary"
                  danger
                  key="retry"
                  onClick={() => navigate(-1)}
                  size="middle"
                >
                  Quay lại
                </Button>,
                <Button onClick={() => navigate("/")} size="middle">
                  Về trang chủ
                </Button>,
              ]}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaymentResult;
