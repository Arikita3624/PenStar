import express from "express";
import * as controller from "../controllers/roomdevicescontroller.js";

const router = express.Router();

router.get("/", controller.getDevices); // Lấy danh sách thiết bị (lọc theo room_type_id, room_id nếu cần)
router.get("/:id", controller.getDeviceById); // Lấy chi tiết thiết bị phòng
router.post("/", controller.createDevice); // Thêm thiết bị mới
router.put("/:id", controller.updateDevice); // Cập nhật thiết bị
router.delete("/:id", controller.deleteDevice); // Xóa thiết bị

// Điều chuyển thiết bị giữa phòng
router.post("/transfer", controller.transferDevice);
// Kiểm tra thiết bị phòng so với tiêu chuẩn loại phòng
router.get("/check-standard/:id", controller.checkRoomDevicesStandard);
// Kiểm tra tiêu chuẩn thiết bị cho tất cả phòng thuộc một loại phòng
// Kiểm tra tiêu chuẩn thiết bị cho tất cả phòng thuộc một loại phòng
router.get(
  "/check-standard-by-type/:roomTypeId",
  controller.checkRoomDevicesStandardByType
);

export default router;
