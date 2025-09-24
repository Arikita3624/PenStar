import express from "express";
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomcontroller.js";

const roomRouter = express.Router();

roomRouter.get("/", getAllRooms);
roomRouter.get("/:id", getRoomById);
roomRouter.post("/", createRoom);
roomRouter.put("/:id", updateRoom);
roomRouter.delete("/:id", deleteRoom);

export default roomRouter;
