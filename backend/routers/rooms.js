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
roomsRouter.get("/:id", validateRoomIdParam, getRoomID);
roomsRouter.post("/", validateRoomCreate, createRoom);
roomsRouter.put("/:id", validateRoomIdParam, validateRoomUpdate, updateRoom);
roomsRouter.delete("/:id", validateRoomIdParam, deleteRoom);

export default roomsRouter;
