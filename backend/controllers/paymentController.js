// import sendMail from "../utils/sendMail";

export const paymentSuccess = async (req, res) => {
  try {
    const { orderId, email, name } = req.body;
    console.log(email, "aaa");
    
    // 1. Cập nhật DB thanh toán thành công
    // await db.query("UPDATE orders SET status = 'PAID' WHERE id = $1", [orderId]);

    // 2. Gửi email xác nhận
    const htmlContent = `
      <h2>Xin chào ${name},</h2>
      <p>Bạn đã thanh toán thành công đơn đặt phòng <strong>#${orderId}</strong>.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      <br/>
      <p>Hotel Booking Team</p>
    `;

    // const mailSent = await sendMail(email, "Xác nhận thanh toán thành công", htmlContent);

    // if (mailSent) {
    //   res.json({ success: true, message: "Thanh toán thành công, email xác nhận đã gửi." });
    // } else {
    //   res.status(500).json({ success: false, message: "Thanh toán thành công nhưng gửi email thất bại." });
    // }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server." });
  }
};
