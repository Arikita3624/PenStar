/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Card, Radio, Button, Space, Typography } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { createPayment } from "@/services/paymentApi";
import { formatPrice } from "@/utils/formatPrice";

// Logo components với ảnh chính thức
const VNPayLogo = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "80px",
      height: "32px",
    }}
  >
    <img
      src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png"
      alt="VNPAY"
      style={{
        height: "100%",
        width: "100%",
        objectFit: "contain",
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='32' viewBox='0 0 80 32'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' font-weight='bold' fill='%230088CC'%3EVNPAY%3C/text%3E%3C/svg%3E";
      }}
    />
  </div>
);

const MoMoLogo = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "80px",
      height: "32px",
    }}
  >
    <img
      src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
      alt="MoMo"
      style={{
        height: "100%",
        width: "100%",
        objectFit: "contain",
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='32' viewBox='0 0 80 32'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' font-weight='bold' fill='%23A50064'%3EMoMo%3C/text%3E%3C/svg%3E";
      }}
    />
  </div>
);

const paymentMethods = [
  {
    value: "vnpay",
    label: "VNPAY",
    icon: <VNPayLogo />,
    description: "Thanh toán qua cổng VNPAY",
  },
  {
    value: "momo",
    label: "Ví MoMo",
    icon: <MoMoLogo />,
    description: "Thanh toán qua ví điện tử MoMo",
  },
];

const PaymentMethodSelect: React.FC = () => {
  const [method, setMethod] = React.useState<string>("vnpay");
  const [bookingInfo, setBookingInfo] = React.useState<any>(null);
  const [isCreatingBooking, setIsCreatingBooking] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra xem có cần tạo booking mới không (từ MultiRoomBookingCreate)
  const shouldCreateBooking = location.state?.shouldCreateBooking;
  const bookingData = location.state?.bookingData;

  // Hoặc là bookingId đã tồn tại (từ flow cũ)
  const bookingId = location.state?.bookingId;
  const initialBookingInfo = location.state?.bookingInfo;

  React.useEffect(() => {
    // Trường hợp 1: Cần tạo booking mới từ bookingData
    if (shouldCreateBooking && bookingData) {
      setBookingInfo(bookingData); // Hiển thị thông tin booking trước
      return;
    }

    // Trường hợp 2: BookingId đã tồn tại - flow cũ
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
  }, [
    bookingId,
    initialBookingInfo,
    shouldCreateBooking,
    bookingData,
    navigate,
  ]);

  const handleConfirm = async () => {
    if (!bookingInfo) {
      alert("Không tìm thấy thông tin booking. Vui lòng đặt phòng lại.");
      return;
    }

    try {
      setIsCreatingBooking(true);
      let finalBookingId = bookingId;
      let finalBookingInfo = bookingInfo;

      // Nếu cần tạo booking mới (từ MultiRoomBookingCreate)
      if (shouldCreateBooking && bookingData) {
        console.log("[PaymentMethodSelect] Tạo booking mới:", bookingData);
        console.log(
          "[PaymentMethodSelect] rooms_config:",
          bookingData.rooms_config
        );
        const { createBooking } = await import("@/services/bookingsApi");
        const createdBooking = await createBooking(bookingData);
        finalBookingId = createdBooking?.id;
        finalBookingInfo = createdBooking;
        console.log("[PaymentMethodSelect] Booking đã tạo:", finalBookingId);
      }

      if (!finalBookingId) {
        alert("Không thể tạo booking. Vui lòng thử lại.");
        setIsCreatingBooking(false);
        return;
      }

      // Chuyển đổi số tiền về kiểu number, không format, không replace
      let totalPrice = finalBookingInfo?.total_price;
      if (typeof totalPrice === "string") {
        totalPrice = Number(totalPrice);
      }
      // Kiểm tra số tiền hợp lệ trước khi gọi VNPAY
      if (method === "vnpay") {
        if (isNaN(totalPrice) || totalPrice < 5000 || totalPrice > 1000000000) {
          alert(
            "Số tiền không hợp lệ. Số tiền phải từ 5,000 đến dưới 1 tỷ VNĐ."
          );
          setIsCreatingBooking(false);
          return;
        }
      }
      // Gọi API cập nhật phương thức thanh toán cho booking
      const { updateMyBooking } = await import("@/services/bookingsApi");
      await updateMyBooking(finalBookingId, { payment_method: method });

      if (method === "vnpay") {
        // Lưu bookingId và bookingInfo vào localStorage để PaymentResult callback có thể lấy
        localStorage.setItem("bookingId", finalBookingId.toString());
        try {
          localStorage.setItem("bookingInfo", JSON.stringify(finalBookingInfo));
        } catch {
          // Ignore localStorage error
        }

        const data = await createPayment({
          amount: totalPrice,
          language: "vn",
          returnUrl: `${window.location.origin}/payment-result`,
        });

        if (data.paymentUrl) {
          window.location.href = data.paymentUrl; // Redirect to VNPay
        } else {
          console.error("No paymentUrl from API");
          navigate(`/bookings/success/${finalBookingId}`, {
            state: {
              booking: finalBookingInfo,
              bookingId: finalBookingId,
              bookingInfo: finalBookingInfo,
              method,
            },
          });
        }
      } else {
        navigate(`/bookings/success/${finalBookingId}`, {
          state: {
            booking: finalBookingInfo,
            bookingId: finalBookingId,
            bookingInfo: finalBookingInfo,
            method,
          },
        });
      }
    } catch (err: any) {
      // Xử lý lỗi
      console.error("Payment method selection failed", err);
      if (err?.response?.data) {
        alert(err.response.data.message || "Có lỗi xảy ra khi tạo booking");
      } else {
        alert("Có lỗi xảy ra. Vui lòng thử lại.");
      }
      setIsCreatingBooking(false);
    }
  };

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
              Chọn phương thức thanh toán
            </h1>
            <p
              className="text-white text-xs"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              Vui lòng chọn cách thức thanh toán phù hợp
            </p>
          </div>
        </div>

        <Card
          className="rounded-xl overflow-hidden border-0"
          style={{
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div
              className="p-4 rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,79,134,0.05) 0%, rgba(13,110,171,0.05) 100%)",
                border: "1px solid rgba(10,79,134,0.1)",
              }}
            >
              <h3 className="text-base font-bold mb-3 text-[#0a4f86]">
                Phương thức thanh toán
              </h3>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ width: "100%" }}
                className="space-y-2"
              >
                {paymentMethods.map((pm) => (
                  <Radio
                    key={pm.value}
                    value={pm.value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border:
                        method === pm.value
                          ? "2px solid #0a4f86"
                          : "1px solid #e5e7eb",
                      background:
                        method === pm.value ? "rgba(10,79,134,0.05)" : "white",
                      marginBottom: "8px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div className="flex items-center gap-3 w-full ml-2">
                      {pm.icon}
                      <div className="flex-1">
                        <div className="text-sm font-bold">{pm.label}</div>
                        <div className="text-xs text-gray-500">
                          {pm.description}
                        </div>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,79,134,0.02) 0%, rgba(13,110,171,0.02) 100%)",
                border: "1px solid rgba(10,79,134,0.1)",
              }}
            >
              <div className="flex justify-between items-center">
                <Typography.Text className="text-gray-700 text-sm font-medium">
                  Tổng tiền:
                </Typography.Text>
                <Typography.Text className="text-xl font-bold text-red-600">
                  {bookingInfo?.total_price != null
                    ? formatPrice(bookingInfo.total_price)
                    : "Đang tải..."}
                </Typography.Text>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                onClick={() => navigate(-1)}
                style={{ minWidth: 120 }}
                disabled={isCreatingBooking}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                onClick={handleConfirm}
                disabled={!bookingInfo || isCreatingBooking}
                loading={isCreatingBooking}
                size="large"
                style={{
                  background:
                    "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                  borderColor: "transparent",
                  height: "44px",
                  fontSize: "15px",
                  fontWeight: "600",
                }}
              >
                {isCreatingBooking ? "Đang xử lý..." : "Xác nhận và thanh toán"}
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethodSelect;
