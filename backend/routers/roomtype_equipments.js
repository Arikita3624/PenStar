import express from "express";
import { getRoomTypeEquipments } from "../controllers/roomtype_equipmentscontroller.js";

const router = express.Router();

// Lấy danh sách thiết bị tiêu chuẩn của loại phòng
router.get("/:id", getRoomTypeEquipments);

export default router;
