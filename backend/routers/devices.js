import express from "express";
import {
  getAllDevices,
  getDevice,
  createDeviceHandler,
  updateDeviceHandler,
  deleteDeviceHandler,
} from "../controllers/devicescontroller.js";
import { validateDevice } from "../middlewares/devicesvalidate.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// GET có thể public (để load danh sách khi checkout)
router.get("/", getAllDevices);
router.get("/:id", getDevice);
// POST, PUT, DELETE cần auth và role staff+
router.post("/", requireAuth, requireRole("staff"), validateDevice, createDeviceHandler);
router.put("/:id", requireAuth, requireRole("staff"), validateDevice, updateDeviceHandler);
router.delete("/:id", requireAuth, requireRole("staff"), deleteDeviceHandler);

export default router;
