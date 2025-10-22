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

const router = express.Router();

// upload route should appear before param routes
router.post(
  "/room/:roomId/upload",
  uploadMiddleware.single("file"),
  uploadImageForRoom
);

router.get("/", getAllRoomImages);
router.get("/:id", validateRoomImageUpdate, getRoomImage);
router.get("/room/:roomId", getImagesByRoom);
router.post("/", validateRoomImageCreate, createImage);
router.put("/:id", validateRoomImageUpdate, updateImage);
router.delete("/:id", validateRoomImageUpdate, deleteImage);

export default router;
