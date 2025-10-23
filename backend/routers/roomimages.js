import express from "express";
import {
  getAllRoomImages,
  getRoomImage,
  getImagesByRoom,
  createImage,
  updateImage,
  deleteImage,
  uploadImageForRoom,
  uploadMiddleware,
} from "../controllers/roomimagescontroller.js";
import {
  validateRoomImageCreate,
  validateRoomImageUpdate,
} from "../middlewares/roomimagevalidate.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// upload route should appear before param routes
router.post(
  "/room/:roomId/upload",
  requireAuth,
  requireRole("staff"),
  uploadMiddleware.single("file"),
  uploadImageForRoom
);

// Public: list images and get images by room for client pages
router.get("/", getAllRoomImages);
router.get("/:id", validateRoomImageUpdate, getRoomImage);
router.get("/room/:roomId", getImagesByRoom);
router.post(
  "/",
  requireAuth,
  requireRole("staff"),
  validateRoomImageCreate,
  createImage
);
router.put(
  "/:id",
  requireAuth,
  requireRole("staff"),
  validateRoomImageUpdate,
  updateImage
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("staff"),
  validateRoomImageUpdate,
  deleteImage
);

export default router;
