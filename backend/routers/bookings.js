import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  getMyBookings,
  updateBookingStatus,
  updateMyBookingStatus,
  confirmCheckout,
  cancelBooking,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("staff"), getBookings);
// register specific routes before parameterized routes
router.get("/mine", requireAuth, getMyBookings);
router.get("/:id", getBookingById);
router.post("/", requireAuth, validateBookingCreate, createBooking);
// Cancel booking - both user and admin can use this endpoint
router.post("/:id/cancel", requireAuth, cancelBooking);
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
