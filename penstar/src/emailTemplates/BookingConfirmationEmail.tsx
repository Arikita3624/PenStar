import * as React from "react";

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingId: number;
  rooms: Array<{
    roomType: string;
    roomId: string | number;
    checkIn: string;
    checkOut: string;
    numAdults: number;
    numChildren: number;
    basePrice?: number;
    extraAdultFees?: number;
    extraChildFees?: number;
    promoCode?: string;
    discountAmount?: number;
  }>;
  totalPrice: number;
  paymentStatus: string;
}

export const BookingConfirmationEmail: React.FC<
  BookingConfirmationEmailProps
> = ({ customerName, bookingId, rooms, totalPrice, paymentStatus }) => (
  <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
    <h2>Xác nhận đặt phòng #{bookingId}</h2>
    <p>
      Xin chào <strong>{customerName}</strong>,
    </p>
    <p>Cảm ơn bạn đã đặt phòng. Dưới đây là thông tin đơn hàng của bạn:</p>
    <h3>Thông tin phòng</h3>
    <ul>
      {rooms.map((i, idx) => (
        <li key={idx} style={{ marginBottom: 12 }}>
          <strong>{i.roomType}</strong> - Phòng: {i.roomId}
          <br />
          Checkin: {i.checkIn} - Checkout: {i.checkOut}
          <br />
          {i.numAdults} người lớn, {i.numChildren} trẻ em
          {typeof i.basePrice === "number" && (
            <>
              <br />
              Giá gốc: {i.basePrice.toLocaleString("vi-VN")}đ
            </>
          )}
          {i.extraAdultFees ? (
            <>
              <br />
              Phụ thu người lớn: {i.extraAdultFees.toLocaleString("vi-VN")}đ
            </>
          ) : null}
          {i.extraChildFees ? (
            <>
              <br />
              Phụ thu trẻ em: {i.extraChildFees.toLocaleString("vi-VN")}đ
            </>
          ) : null}
        </li>
      ))}
    </ul>
    <p>
      <strong>Tổng cộng: {totalPrice.toLocaleString("vi-VN")}đ</strong>
    </p>
    <p>
      Trạng thái thanh toán: <strong>{paymentStatus}</strong>
    </p>
    <p>Chúng tôi đã giữ các phòng cho đến khi nhận thanh toán.</p>
    <hr />
    <p>PenStar Hotel</p>
  </div>
);

export default BookingConfirmationEmail;
