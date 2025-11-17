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
  checkIn,
  createChangeRequest,
  getChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
} from "../controllers/bookingscontroller.js";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth.js";
import { validateBookingCreate, validateCheckIn } from "../middlewares/bookingvalidate.js";

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
// Staff check-in: update guest info (id card, name, phone) + set stay_status to checked_in
router.post(
  "/:id/checkin",
  requireAuth,
  requireRole("staff"),
  validateCheckIn,
  checkIn
);
// Change room in booking - both customer and staff can use
router.patch("/:id/change-room", requireAuth, changeRoomInBooking);
// Customer -> create change request
router.post("/:id/request-change", requireAuth, createChangeRequest);
// Staff -> list requests for a booking
router.get("/:id/change-requests", requireAuth, requireRole("staff"), getChangeRequests);
// Staff -> approve/reject specific request
router.post("/change-requests/:reqId/approve", requireAuth, requireRole("staff"), approveChangeRequest);
router.post("/change-requests/:reqId/reject", requireAuth, requireRole("staff"), rejectChangeRequest);

export default router;
