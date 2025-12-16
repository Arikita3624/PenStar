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
    // Lấy query parameters từ callback
    const queryParams = new URLSearchParams(location.search);

    // Kiểm tra xem là VNPay hay MoMo
    // MoMo thật có thể không có paymentMethod, nhưng có resultCode, partnerCode
    const paymentMethod = queryParams.get("paymentMethod");
    const resultCode = queryParams.get("resultCode");
    const partnerCode = queryParams.get("partnerCode");

    // Nếu có resultCode hoặc partnerCode thì là MoMo thật
    // Nếu có paymentMethod=momo thì là MoMo (mock hoặc có paymentMethod)
    const isMoMo =
      paymentMethod === "momo" || resultCode !== null || partnerCode === "MOMO";

    let status: any = {
      success: false,
      responseCode: null,
      transactionNo: null,
      amount: 0,
      orderId: null,
    };

    if (isMoMo) {
      // Xử lý callback từ MoMo (có thể là mock hoặc thật)
      // MoMo thật trả về: resultCode, orderId, amount, transId, ...
      // MoMo mock trả về: status, orderId, amount, ...
      const momoStatus = queryParams.get("status"); // Mock mode
      const orderId = queryParams.get("orderId");
      const amount = queryParams.get("amount");
      const transId = queryParams.get("transId");

      // Nếu có resultCode thì là MoMo thật, nếu không thì là mock
      if (resultCode !== null) {
        // MoMo thật: resultCode = "0" hoặc 0 là thành công
        const resultCodeNum = Number(resultCode);
        status = {
          responseCode: resultCode,
          transactionNo: transId || orderId || null,
          amount: amount ? Number(amount) : 0,
          orderId: orderId || null,
          success: resultCode === "0" || resultCodeNum === 0,
          paymentMethod: "momo",
        };
      } else {
        // MoMo mock: status = "success" là thành công
        status = {
          responseCode: momoStatus === "success" ? "00" : "99",
          transactionNo: orderId || null,
          amount: amount ? Number(amount) : 0,
          orderId: orderId || null,
          success: momoStatus === "success",
          paymentMethod: "momo",
        };
      }
    } else {
      // Xử lý callback từ VNPay
      const responseCode = queryParams.get("vnp_ResponseCode");
      const transactionNo = queryParams.get("vnp_TransactionNo");
      const amount = queryParams.get("vnp_Amount");
      const orderId = queryParams.get("vnp_TxnRef");

      status = {
        responseCode,
        transactionNo,
        amount: amount ? Number(amount) / 100 : 0, // VNPAY gửi amount × 100
        orderId,
        success: responseCode === "00",
        paymentMethod: "vnpay",
      };
    }

    setPaymentStatus(status);
    setLoading(false);
  }, [location.search]);

  const handleGoToBookingSuccess = async () => {
    const bookingId = localStorage.getItem("bookingId");
    if (!bookingId) {
      alert("Không tìm thấy bookingId");
      return;
    }

    // Lấy bookingInfo từ localStorage nếu có
    let bookingInfoFromStorage = null;
    try {
      const stored = localStorage.getItem("bookingInfo");
      if (stored) {
        bookingInfoFromStorage = JSON.parse(stored);
      }
    } catch {
      // Ignore parse error
    }

    // Redirect ngay lập tức, không đợi update payment_status
    localStorage.removeItem("bookingId");

    // Redirect với bookingInfo nếu có để tránh fetch lại
    navigate(`/bookings/success/${bookingId}`, {
      replace: true,
      state: bookingInfoFromStorage
        ? { booking: bookingInfoFromStorage }
        : undefined,
    });

    // Update payment_status ở background (không chặn UI)
    setUpdating(true);
    (async () => {
      try {
        const { updateMyBooking } = await import("@/services/bookingsApi");
        await updateMyBooking(Number(bookingId), { payment_status: "paid" });
      } catch (err: any) {
        console.error(" Lỗi cập nhật trạng thái booking (background):", err);
      } finally {
        setUpdating(false);
      }
    })();
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
                  key="retry"
                  onClick={async () => {
                    const bookingId = localStorage.getItem("bookingId");
                    if (bookingId) {
                      try {
                        const { getBookingById } = await import(
                          "@/services/bookingsApi"
                        );
                        const bookingInfo = await getBookingById(
                          Number(bookingId)
                        );
                        navigate("/bookings/payment-method", {
                          state: {
                            bookingId: Number(bookingId),
                            bookingInfo: bookingInfo,
                          },
                        });
                      } catch (err) {
                        console.error("Error fetching booking:", err);
                        navigate(-1);
                      }
                    } else {
                      navigate(-1);
                    }
                  }}
                  size="middle"
                  style={{
                    background:
                      "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                    borderColor: "transparent",
                  }}
                >
                  Thanh toán lại
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
