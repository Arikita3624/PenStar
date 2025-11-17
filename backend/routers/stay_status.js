import express from "express";
import { getStayStatuses } from "../controllers/stay_statuscontroller.js";

const router = express.Router();

router.get("/", getStayStatuses);

export default router;
