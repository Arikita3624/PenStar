export const bookingConfirmationTemplate = (booking) => {
  const itemsHtml = (booking.items || [])
    .map(
      (i, idx) => `
      <li>
        <strong>Phòng ${idx + 1}: ${i.room_name || ""}</strong><br/>
        Ngày nhận phòng: ${i.check_in || ""}<br/>
        Ngày trả phòng: ${i.check_out || ""}
      </li>`
    )
    .join("");

  const servicesHtml = (booking.services || [])
    .map(
      (s) =>
        `<li>Dịch vụ: ${s.service_id} - Số lượng: ${s.quantity} - Giá: ${s.total_service_price} VND</li>`
    )
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; color:#333;">
    <h2>Xác nhận đặt phòng #${booking.id}</h2>
    <p>Xin chào <strong>${booking.customer_name || ""}</strong> (${
    booking.email || "Không có email"
  })</p>
    <p>Cảm ơn bạn đã đặt phòng tại PenStar Hotel.</p>
    <ul>
      <li><b>Số điện thoại:</b> ${booking.phone || "Không có số"}</li>
    </ul>
    <h3>Danh sách phòng</h3>
    <ul>${itemsHtml}</ul>
    ${servicesHtml ? `<h3>Dịch vụ</h3><ul>${servicesHtml}</ul>` : ""}
    <hr/>
    <p>PenStar Hotel</p>
  </div>`;
};

export default bookingConfirmationTemplate;
