import express from "express";
import {
  getRooms,
  getRoomID,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomscontroller.js";
import {
  validateRoomCreate,
  validateRoomUpdate,
  validateRoomIdParam,
} from "../middlewares/roomvalidate.js";

const roomsRouter = express.Router();

roomsRouter.get("/", getRooms);
// Check if a room name exists for a given type (query params: name, type_id, excludeId)
roomsRouter.get("/check-name", async (req, res) => {
  try {
    const { name, type_id, excludeId } = req.query;
    if (!name || !type_id)
      return res
        .status(400)
        .json({ success: false, message: "name and type_id required" });
    const exists = await (
      await import("../models/roomsmodel.js")
    ).existsRoomWithNameAndType(
      String(name),
      Number(type_id),
      excludeId ? Number(excludeId) : null
    );
    res.json({ success: true, exists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
roomsRouter.get("/:id", validateRoomIdParam, getRoomID);
roomsRouter.post("/", validateRoomCreate, createRoom);
roomsRouter.put("/:id", validateRoomIdParam, validateRoomUpdate, updateRoom);
roomsRouter.delete("/:id", validateRoomIdParam, deleteRoom);

export default roomsRouter;
