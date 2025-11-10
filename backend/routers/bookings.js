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
  changeRoomInBooking,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("staff"), getBookings);
// register specific routes before parameterized routes
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
// POST /bookings - Require auth: customer or staff can create booking
router.post("/", requireAuth, validateBookingCreate, createBooking);
// Cancel booking - both user and admin can use this endpoint
router.post("/:id/cancel", requireAuth, cancelBooking);
// Guest update booking payment info (auth required)
router.patch("/:id", requireAuth, updateGuestBooking);
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
// Change room in booking - both customer and staff can use
router.patch("/:id/change-room", requireAuth, changeRoomInBooking);

export default router;
