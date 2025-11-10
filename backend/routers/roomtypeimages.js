import express from "express";
import {
  getAllRoomTypeImages,
  getRoomTypeImage,
  getImagesByRoomType,
  createImage,
  updateImage,
  deleteImage,
  uploadImageForRoomType,
  uploadMiddleware,
} from "../controllers/roomtypeimagescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Upload route
router.post(
  "/roomtype/:roomTypeId/upload",
  requireAuth,
  requireRole("staff"),
  uploadMiddleware.single("file"),
  uploadImageForRoomType
);

// Public routes
router.get("/", getAllRoomTypeImages);
router.get("/:id", getRoomTypeImage);
router.get("/roomtype/:roomTypeId", getImagesByRoomType);

// Protected routes
router.post("/", requireAuth, requireRole("staff"), createImage);
router.put("/:id", requireAuth, requireRole("staff"), updateImage);
router.delete("/:id", requireAuth, requireRole("staff"), deleteImage);

export default router;
