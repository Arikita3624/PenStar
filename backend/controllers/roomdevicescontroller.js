import { getRooms } from "../models/roomsmodel.js";

// Kiểm tra tiêu chuẩn thiết bị cho tất cả phòng thuộc một loại phòng
export const checkRoomDevicesStandardByType = async (req, res) => {
  const roomTypeId = req.params.roomTypeId;
  try {
    // Lấy tất cả phòng thuộc loại này
    const rooms = await getRooms();
    const filteredRooms = rooms.filter(
      (r) => String(r.type_id) === String(roomTypeId)
    );
    const results = [];
    for (const room of filteredRooms) {
      const result = await validateRoomEquipments(room.id);
      results.push({ room_id: room.id, room_name: room.name, ...result });
    }
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[checkRoomDevicesStandardByType] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getDeviceById = async (req, res) => {
  try {
    const device = await model.getDeviceById(Number(req.params.id));
    if (!device)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
import * as model from "../models/room_devicesmodel.js";

export const getDevices = async (req, res) => {
  try {
    const { room_id } = req.query;
    const devices = await model.getDevices({
      room_id: room_id ? Number(room_id) : null,
    });
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDevice = async (req, res) => {
  try {
    // req.body.images: mảng đường dẫn ảnh (nếu có)
    const device = await model.createDevice(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDevice = async (req, res) => {
  try {
    // req.body.images: mảng đường dẫn ảnh (nếu có)
    const { id } = req.params;
    const device = await model.updateDevice(Number(id), req.body);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await model.deleteDevice(Number(id));
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Điều chuyển thiết bị giữa 2 phòng, đồng thời ghi log
import { createStockLog } from "../models/equipment_stock_logsmodel.js";
export const transferDevice = async (req, res) => {
  try {
    const {
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    } = req.body;
    await model.transferDevice({
      equipment_id,
      quantity,
      from_room_id,
      to_room_id,
    });
    // Ghi log điều chuyển
    await createStockLog({
      equipment_id,
      type: "transfer",
      quantity,
      from_room_id,
      to_room_id,
      note,
      created_by,
    });
    res.json({ success: true, message: "Điều chuyển thành công" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
import { validateRoomEquipments } from "../utils/validateRoomEquipments.js";

export const checkRoomDevicesStandard = async (req, res) => {
  const roomId = req.params.id;
  console.log("[checkRoomDevicesStandard] Called with roomId:", roomId);
  try {
    const result = await validateRoomEquipments(roomId);
    console.log("[checkRoomDevicesStandard] Result:", result);
    res.json(result);
  } catch (error) {
    console.error("[checkRoomDevicesStandard] Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
