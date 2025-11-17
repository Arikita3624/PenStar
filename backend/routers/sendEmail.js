import express from "express";
import { paymentSuccess } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/success", paymentSuccess);

export default router;
