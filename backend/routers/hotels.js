import express from "express";
import {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} from "../controllers/hotelcontroller.js";

const hotelRouter = express.Router();

hotelRouter.get("/", getAllHotels);
hotelRouter.get("/:id", getHotelById);
hotelRouter.post("/", createHotel);
hotelRouter.put("/:id", updateHotel);
hotelRouter.delete("/:id", deleteHotel);

export default hotelRouter;
