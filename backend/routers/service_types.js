import express from "express";
import {
  getServiceTypes,
  getServiceTypeByCode,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "../controllers/servicetypescontroller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.get("/", getServiceTypes);
router.get("/:code", getServiceTypeByCode);

// Protected routes (admin only)
router.post("/", requireAuth, createServiceType);
router.put("/:code", requireAuth, updateServiceType);
router.delete("/:code", requireAuth, deleteServiceType);

export default router;
