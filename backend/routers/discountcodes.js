import express from "express";
import {
  getDiscountCodes,
  getActiveDiscountCodes,
  getDiscountCodeById,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  validateDiscountCode,
} from "../controllers/discountcodescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Public endpoints - for customers
router.get("/available", getActiveDiscountCodes); // Get active discount codes
router.get("/validate", validateDiscountCode); // Validate discount code

// Admin endpoints
router.get("/", requireAuth, requireRole("staff"), getDiscountCodes);
router.get("/:id", requireAuth, requireRole("staff"), getDiscountCodeById);
router.post("/", requireAuth, requireRole("staff"), createDiscountCode);
router.put("/:id", requireAuth, requireRole("staff"), updateDiscountCode);
router.delete("/:id", requireAuth, requireRole("staff"), deleteDiscountCode);

export default router;

