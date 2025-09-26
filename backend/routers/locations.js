import express from "express";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/locationcontroller.js";

const locationRouter = express.Router();

locationRouter.get("/", getAllLocations);
locationRouter.get("/:id", getLocationById);
locationRouter.post("/", createLocation);
locationRouter.put("/:id", updateLocation);
locationRouter.delete("/:id", deleteLocation);

export default locationRouter;
