import express from "express";

import {
  getRoomTypes,
  createRoomType,
} from "../controllers/roomtypescontroller.js";

const roomTypeRouter = express.Router();

roomTypeRouter.get("/", getRoomTypes);
roomTypeRouter.post("/", createRoomType);

export default roomTypeRouter;
