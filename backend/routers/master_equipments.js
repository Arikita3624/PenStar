import express from "express";
import * as controller from "../controllers/master_equipmentscontroller.js";

const router = express.Router();

router.get("/", controller.getAllEquipments);
router.get("/:id", controller.getEquipmentById);
router.post("/", controller.createEquipment);
router.put("/:id", controller.updateEquipment);
router.delete("/:id", controller.deleteEquipment);

export default router;
