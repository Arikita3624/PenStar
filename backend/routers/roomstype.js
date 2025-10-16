import express from "express";

import {
  getRoomTypes,
  createRoomType,
} from "../controllers/roomtypescontroller.js";

import {
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
} from "../controllers/roomtypescontroller.js";

const roomTypeRouter = express.Router();

roomTypeRouter.get("/", getRoomTypes);
roomTypeRouter.post("/", createRoomType);
// Check if a room type name exists (query: name, excludeId)
roomTypeRouter.get("/check-name", async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    if (!name)
      return res.status(400).json({ success: false, message: "name required" });
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const exists = await existsRoomTypeWithName(
      String(name),
      excludeId ? Number(excludeId) : null
    );
    return res.json({ success: true, exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
roomTypeRouter.get("/:id", getRoomTypeById);
roomTypeRouter.put("/:id", updateRoomType);
roomTypeRouter.delete("/:id", deleteRoomType);

export default roomTypeRouter;
