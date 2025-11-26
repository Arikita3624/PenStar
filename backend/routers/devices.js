import express from "express";
import {
  getAllDevices,
  getDevice,
  createDeviceHandler,
  updateDeviceHandler,
  deleteDeviceHandler,
} from "../controllers/devicescontroller.js";
import { validateDevice } from "../middlewares/devicesvalidate.js";

const router = express.Router();

router.get("/", getAllDevices);
router.get("/:id", getDevice);
router.post("/", validateDevice, createDeviceHandler);
router.put("/:id", validateDevice, updateDeviceHandler);
router.delete("/:id", deleteDeviceHandler);

export default router;
