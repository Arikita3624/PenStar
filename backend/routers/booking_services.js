import express from "express";
import {
  getBookingServices,
  getBookingServiceById,
  createBookingService,
  getServicesByBookingItem,
  getServicesByBooking,
} from "../controllers/booking_servicescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingServiceCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", getBookingServices);
router.get("/booking/:booking_id", getServicesByBooking);
router.get("/booking-item/:booking_item_id", getServicesByBookingItem);
router.get("/:id", getBookingServiceById);
router.post(
  "/",
  requireAuth,
  requireRole("staff"),
  validateBookingServiceCreate,
  createBookingService
);
// ...existing code...
// router.delete("/:id", requireAuth, requireRole("staff"), deleteBookingService); // Đã vô hiệu hóa chức năng xóa dịch vụ

export default router;
