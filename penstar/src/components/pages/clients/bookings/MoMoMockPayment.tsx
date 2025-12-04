import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, Button, Typography, Space, Divider } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const MoMoMockPayment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const returnUrl = searchParams.get("returnUrl") || "/payment-result";
  const orderInfo = searchParams.get("orderInfo") || "Thanh toán đơn hàng";

  const formatPrice = (price: number | string) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  const handlePayment = () => {
    setProcessing(true);
    
    // Simulate payment processing với countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect về returnUrl với status=success
          const url = new URL(returnUrl, window.location.origin);
          url.searchParams.set("status", "success");
          url.searchParams.set("orderId", orderId || "");
          url.searchParams.set("amount", amount || "");
          url.searchParams.set("paymentMethod", "momo");
          url.searchParams.set("testMode", "true");
          window.location.href = url.toString();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancel = () => {
    // Redirect về returnUrl với status=cancel
    const url = new URL(returnUrl, window.location.origin);
    url.searchParams.set("status", "cancel");
    url.searchParams.set("orderId", orderId || "");
    url.searchParams.set("amount", amount || "");
    url.searchParams.set("paymentMethod", "momo");
    window.location.href = url.toString();
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <LoadingOutlined style={{ fontSize: 64, color: "#A50064" }} spin />
          <Title level={3} className="mt-6 mb-2" style={{ color: "#A50064" }}>
            Đang xử lý thanh toán...
          </Title>
          <Text type="secondary">
            Vui lòng đợi {countdown} giây
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        {/* MoMo Header */}
        <div className="text-center mb-6">
          <div className="mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
              alt="MoMo"
              className="h-12 mx-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {!document.querySelector('img[alt="MoMo"]')?.getAttribute("src") && (
              <div className="text-3xl font-bold" style={{ color: "#A50064" }}>
                MoMo
              </div>
            )}
          </div>
          <Title level={4} style={{ color: "#A50064", margin: 0 }}>
            Thanh toán qua ví MoMo
          </Title>
          <Text type="secondary" className="text-xs">
            (Chế độ test - Mock Payment)
          </Text>
        </div>

        <Divider />

        {/* Order Info */}
        <div className="mb-6">
          <Text strong className="block mb-2">
            Thông tin đơn hàng:
          </Text>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <Text type="secondary">Mã đơn hàng:</Text>
              <Text strong>{orderId || "N/A"}</Text>
            </div>
            <div className="flex justify-between">
              <Text type="secondary">Nội dung:</Text>
              <Text>{orderInfo}</Text>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between items-center">
              <Text strong className="text-lg">
                Số tiền:
              </Text>
              <Text strong className="text-xl" style={{ color: "#A50064" }}>
                {amount ? formatPrice(Number(amount)) : "N/A"}
              </Text>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Text type="warning" className="text-xs">
            ⚠️ Đây là trang thanh toán giả lập (Mock) để test flow. 
            Trong môi trường thực tế, bạn sẽ được chuyển đến trang thanh toán MoMo chính thức.
          </Text>
        </div>

        {/* Action Buttons */}
        <Space direction="vertical" className="w-full" size="middle">
          <Button
            type="primary"
            block
            size="large"
            onClick={handlePayment}
            style={{
              backgroundColor: "#A50064",
              borderColor: "#A50064",
              height: "48px",
            }}
          >
            Xác nhận thanh toán
          </Button>
          <Button block size="large" onClick={handleCancel}>
            Hủy thanh toán
          </Button>
        </Space>

        <div className="mt-4 text-center">
          <Text type="secondary" className="text-xs">
            Bằng việc xác nhận, bạn đồng ý với{" "}
            <a href="#" className="text-pink-600">
              Điều khoản sử dụng
            </a>{" "}
            của MoMo
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default MoMoMockPayment;

