import express from "express";
import {
  importEquipment,
  exportEquipment,
  transferEquipment,
  getEquipmentLogs,
  getAllLogs,
} from "../controllers/equipment_stock_logscontroller.js";

const router = express.Router();

router.post("/import", importEquipment);
router.post("/export", exportEquipment);
router.post("/transfer", transferEquipment);
router.get("/logs", getEquipmentLogs);
router.get("/logs/all", getAllLogs);

export default router;
