import {
  getBookings as modelGetBookings,
  getBookingById as modelGetBookingById,
  createBooking as modelCreateBooking,
} from "../models/bookingsmodel.js";
import pool from "../db.js";
import { updateBookingStatus as modelUpdateBookingStatus } from "../models/bookingsmodel.js";
import crypto from "crypto";
import querystring from "querystring";

export const getBookings = async (req, res) => {
  try {
    const data = await modelGetBookings();
    res.json({
      success: true,
      message: "✅ Get all bookings successfully",
      data,
    });
  } catch (error) {
    console.error("bookingscontroller.getBookings error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const getBookingById = async (req, res) => {
  const { id } = req.params;
  try {
    const booking = await modelGetBookingById(id);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // fetch items and services
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [id]
    );
    const servicesRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1",
      [id]
    );

    booking.items = itemsRes.rows;
    booking.services = servicesRes.rows;

    res.json({
      success: true,
      message: "✅ Get booking by ID successfully",
      data: booking,
    });
  } catch (error) {
    console.error("bookingscontroller.getBookingById error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const payload = req.body;
    // If authenticated, prefer user id from token
    if (req.user && req.user.id) {
      payload.user_id = Number(req.user.id);
    }
    const booking = await modelCreateBooking(payload);

    // fetch created items and services
    const itemsRes = await pool.query(
      "SELECT * FROM booking_items WHERE booking_id = $1",
      [booking.id]
    );
    const servicesRes = await pool.query(
      "SELECT * FROM booking_services WHERE booking_id = $1",
      [booking.id]
    );
    booking.items = itemsRes.rows;
    booking.services = servicesRes.rows;
    res.status(201).json({
      success: true,
      message: "✅ Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("bookingscontroller.createBooking error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: related record not found",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// Create payment URL for VNPAY (demo implementation)
export const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, returnUrl } = req.body;
    if (!bookingId || !amount)
      return res
        .status(400)
        .json({ success: false, message: "Missing bookingId or amount" });

    const vnpUrl =
      process.env.VNP_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const vnp_TmnCode = process.env.VNP_TMN_CODE || "TEST";
    const vnp_HashSecret = process.env.VNP_HASH_SECRET || "SECRET";

    const params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Amount: String(Number(amount) * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: String(bookingId),
      vnp_OrderInfo: `Payment for booking ${bookingId}`,
      vnp_ReturnUrl:
        returnUrl ||
        `${req.protocol}://${req.get("host")}/api/bookings/vnpay_return`,
      vnp_IpAddr: req.ip,
      vnp_CreateDate: new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .slice(0, 14),
    };

    const signData = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const hmac = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(signData)
      .digest("hex");
    const fullUrl =
      vnpUrl + "?" + querystring.stringify(params) + `&vnp_SecureHash=${hmac}`;

    res.json({ success: true, url: fullUrl });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};

// VNPAY return (customer redirect) - update payment_status accordingly
export const vnpayReturn = async (req, res) => {
  try {
    // Verify VNPAY return signature and update booking status
    const params = { ...req.query };
    const vnp_SecureHash = params.vnp_SecureHash;
    const vnp_ResponseCode = params.vnp_ResponseCode;
    const vnp_TxnRef = params.vnp_TxnRef;
    const bookingId = Number(vnp_TxnRef);
    if (!bookingId) return res.status(400).send("Invalid txn");

    // compute hash
    const vnp_HashSecret = process.env.VNP_HASH_SECRET || "SECRET";
    const signingData = Object.keys(params)
      .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const calcHash = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(signingData)
      .digest("hex");

    const valid = String(calcHash) === String(vnp_SecureHash);
    if (!valid) {
      console.warn("VNPAY return signature mismatch", { bookingId });
    }

    const success = vnp_ResponseCode === "00" && valid;
    const fields = { payment_status: success ? "paid" : "failed" };
    await modelUpdateBookingStatus(bookingId, fields);
    const frontend = process.env.FRONTEND_URL || "/";
    return res.redirect(`${frontend}bookings/success/${bookingId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};

// VNPAY IPN callback (server-to-server notify)
export const vnpayIPN = async (req, res) => {
  try {
    const params = { ...req.body };
    const vnp_SecureHash = params.vnp_SecureHash;
    const vnp_ResponseCode = params.vnp_ResponseCode;
    const vnp_TxnRef = params.vnp_TxnRef;
    const bookingId = Number(vnp_TxnRef);
    if (!bookingId) return res.status(400).json({ success: false });

    const vnp_HashSecret = process.env.VNP_HASH_SECRET || "SECRET";
    const signingData = Object.keys(params)
      .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const calcHash = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(signingData)
      .digest("hex");
    if (String(calcHash) !== String(vnp_SecureHash)) {
      console.warn("VNPAY IPN signature mismatch", { bookingId });
      return res.status(400).json({ success: false });
    }

    const success = vnp_ResponseCode === "00";
    await modelUpdateBookingStatus(bookingId, {
      payment_status: success ? "paid" : "failed",
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updated = await modelUpdateBookingStatus(id, fields);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Internal error", error: err.message });
  }
};
