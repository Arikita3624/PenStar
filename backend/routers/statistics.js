import express from "express";
import { getStatistics } from "../controllers/statisticscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Get statistics - Manager and Admin only
router.get("/", requireAuth, requireRole("manager", "admin"), getStatistics);

export default router;

