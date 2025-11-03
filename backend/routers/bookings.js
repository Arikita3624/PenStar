import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  getMyBookings,
  updateBookingStatus,
  updateMyBookingStatus,
  updateGuestBooking,
  confirmCheckout,
  cancelBooking,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("staff"), getBookings);
// register specific routes before parameterized routes
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
// POST /bookings - Can be called with or without auth
// - With auth (customer/staff): normal booking
// - Without auth: walk-in booking (staff creates for customer)
router.post("/", optionalAuth, validateBookingCreate, createBooking);
// Cancel booking - both user and admin can use this endpoint
router.post("/:id/cancel", requireAuth, cancelBooking);
// Guest update booking payment info (no auth required)
router.patch("/:id", optionalAuth, updateGuestBooking);
// Client can update their own booking (check-in, check-out)
router.patch("/:id/my-status", requireAuth, updateMyBookingStatus);
// Admin updates booking status
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("staff"),
  updateBookingStatus
);
router.post(
  "/:id/confirm-checkout",
  requireAuth,
  requireRole("staff"),
  confirmCheckout
);

export default router;
