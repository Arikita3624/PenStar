import express from "express";
import {
  createFloor,
  getFloorID,
  getFloors,
} from "../controllers/floorscontroller.js";

const FloorsRouter = express.Router();

FloorsRouter.get("/", getFloors);
FloorsRouter.get("/:id", getFloorID);
FloorsRouter.post("/", createFloor);

export default FloorsRouter;
