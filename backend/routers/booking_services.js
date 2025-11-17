import express from "express";
import {
  getBookingServices,
  getBookingServiceById,
  createBookingService,
  deleteBookingService,
  createBookingServiceRequest,
} from "../controllers/booking_servicescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingServiceCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", getBookingServices);
router.get("/:id", getBookingServiceById);
router.post(
  "/",
  requireAuth,
  requireRole("staff"),
  validateBookingServiceCreate,
  createBookingService
);
// Customer can request a service for their own booking (must be authenticated)
router.post(
  "/request",
  requireAuth,
  validateBookingServiceCreate,
  createBookingServiceRequest
);
router.delete("/:id", requireAuth, requireRole("staff"), deleteBookingService);

export default router;
