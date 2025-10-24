import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  createPayment,
  vnpayReturn,
  vnpayIPN,
  updateBookingStatus,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", requireAuth, validateBookingCreate, createBooking);
router.post("/create-payment", requireAuth, createPayment);
router.get("/vnpay_return", vnpayReturn);
router.post("/vnpay_ipn", vnpayIPN);
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("staff"),
  updateBookingStatus
);

export default router;
