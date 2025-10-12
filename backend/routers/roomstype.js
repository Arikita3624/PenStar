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
roomTypeRouter.get("/:id", getRoomTypeById);
roomTypeRouter.put("/:id", updateRoomType);
roomTypeRouter.delete("/:id", deleteRoomType);

export default roomTypeRouter;
