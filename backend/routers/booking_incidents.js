import express from "express";
import * as controller from "../controllers/booking_incidentscontroller.js";

const router = express.Router();

router.get("/", controller.getIncidentsByBooking); // ?booking_id=xx
router.post("/", controller.createIncident);
router.delete("/:id", controller.deleteIncident);

export default router;
