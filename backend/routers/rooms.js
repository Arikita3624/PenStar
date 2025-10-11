import express from "express";
import {
  getRooms,
  getRoomID,
  createRoom,
  updateRoom,
} from "../controllers/roomscontroller.js";
import { validateRoomCreate } from "../middlewares/roomvalidate.js";

const roomsRouter = express.Router();

roomsRouter.get("/", getRooms);
roomsRouter.get("/:id", getRoomID);
roomsRouter.post("/", validateRoomCreate, createRoom);
roomsRouter.put("/:id", validateRoomCreate, updateRoom);

export default roomsRouter;
