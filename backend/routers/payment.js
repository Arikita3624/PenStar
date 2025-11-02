import { Router } from "express";
import qs from "querystring";
import crypto from "crypto";
import moment from "moment";

const paymentRouter = Router();

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

paymentRouter.get("/create_payment", (req, res) => {
  const { amount } = req.query;
  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum < 5000 || amountNum > 1000000000) {
    return res.status(400).json({
      error: "Số tiền không hợp lệ. Số tiền phải từ 5,000 đến dưới 1 tỷ VNĐ.",
    });
  }
  const tmnCode = "1QN514ZX"; // Lấy từ VNPay .env
  const secretKey = "OC9XPP932WGHC29PZEX46NXITSHZKLX9"; // Lấy từ VNPay

  const returnUrl = "http://localhost:5173/payment-result"; // Trang kết quả
  const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

  let ipAddr = req.ip;
  let orderId = moment().format("YYYYMMDDHHmmss");
  let bankCode = req.query.bankCode || "NCB";

  let createDate = moment().format("YYYYMMDDHHmmss");
  let orderInfo = "Thanh_toan_don_hang";
  let locale = req.query.language || "vn";
  let currCode = "VND";

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "billpayment",
    vnp_Amount: amountNum * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  let signData = qs.stringify(vnp_Params);
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  let paymentUrl = vnp_Url + "?" + qs.stringify(vnp_Params);
  res.json({ paymentUrl });
});
paymentRouter.get("/check_payment", (req, res) => {
  const query = req.query;
  const secretKey = "OC9XPP932WGHC29PZEX46NXITSHZKLX9";
  const vnp_SecureHash = query.vnp_SecureHash;

  delete query.vnp_SecureHash;
  const signData = qs.stringify(query);

  const hmac = crypto.createHmac("sha512", secretKey);
  const checkSum = hmac.update(signData).digest("hex");
  console.log(query);

  if (vnp_SecureHash === checkSum) {
    if (query.vnp_ResponseCode === "00") {
      res.json({ message: "Thanh toán thành công", data: query });
    } else {
      res.json({ message: "Thanh toán thất bại", data: query });
    }
  } else {
    res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }
});

export default paymentRouter;
