import React, { useEffect, useState } from "react";
import axios from "axios";

const PaymentSuccess = () => {
  const [message, setMessage] = useState("Đang xử lý...");

  useEffect(() => {
    const sendEmail = async () => {
      try {
        const email = localStorage.getItem("customerEmail");
        const name = localStorage.getItem("customerName");
        const orderId = localStorage.getItem("orderId");

        const res = await axios.post("http://localhost:5000/api/payment/success", {
          orderId,
          email,
          name,
        });

        if (res.data.success) {
          setMessage("✅ Thanh toán thành công! Email xác nhận đã được gửi.");
        } else {
          setMessage("⚠️ Thanh toán thành công nhưng gửi email thất bại.");
        }
      } catch (error) {
        console.error(error);
        setMessage("❌ Có lỗi xảy ra khi gửi email xác nhận.");
      }
    };

    sendEmail();
  }, []);

  return (
    <div className="text-center mt-10">
      <h2 className="text-2xl font-bold text-green-600 mb-4">Thanh toán thành công!</h2>
      <p>{message}</p>
    </div>
  );
};

export default PaymentSuccess;
