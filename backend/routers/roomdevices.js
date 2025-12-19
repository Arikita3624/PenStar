import express from "express";
import * as controller from "../controllers/roomdevicescontroller.js";

const router = express.Router();

router.get("/", controller.getDevices); // Lấy danh sách thiết bị (lọc theo room_type_id, room_id nếu cần)
router.post("/", controller.createDevice); // Thêm thiết bị mới
router.put("/:id", controller.updateDevice); // Cập nhật thiết bị
router.delete("/:id", controller.deleteDevice); // Xóa thiết bị

// Điều chuyển thiết bị giữa phòng
router.post("/transfer", controller.transferDevice);

export default router;
