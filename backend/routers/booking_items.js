import express from "express";
import {
  getBookingItems,
  getBookingItemById,
  createBookingItem,
  deleteBookingItem,
} from "../controllers/booking_itemscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validateBookingItemCreate } from "../middlewares/bookingvalidate.js";

const router = express.Router();

router.get("/", getBookingItems);
router.get("/:id", getBookingItemById);
router.post(
  "/",
  requireAuth,
  requireRole("staff"),
  validateBookingItemCreate,
  createBookingItem
);
router.delete("/:id", requireAuth, requireRole("staff"), deleteBookingItem);

export default router;
