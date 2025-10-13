import express from "express";
import {
  createFloor,
  getFloorID,
  getFloors,
  updateFloor,
  deleteFloor,
} from "../controllers/floorscontroller.js";

const FloorsRouter = express.Router();

FloorsRouter.get("/", getFloors);
FloorsRouter.get("/:id", getFloorID);
FloorsRouter.post("/", createFloor);
FloorsRouter.put("/:id", updateFloor);
FloorsRouter.delete("/:id", deleteFloor);

export default FloorsRouter;
