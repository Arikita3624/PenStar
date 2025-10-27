import {
  getRooms as modelGetRooms,
  getRoomID as modelGetRoomById,
  createRoom as modelCreateRoom,
  updateRoom as modelUpdateRoom,
  deleteRoom as modelDeleteRoom,
  existsRoomWithName,
} from "../models/roomsmodel.js";

// 🏨 GET all rooms
export const getRooms = async (req, res) => {
  try {
    const data = await modelGetRooms();
    res.json({
      success: true,
      message: "✅ Get all rooms successfully",
      data,
    });
  } catch (error) {
    console.error("roomscontroller.createRoom error:", error);
    // handle PostgreSQL foreign key violation (error.code === '23503')
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: related record not found",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 GET room by ID
export const getRoomID = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    const room = await modelGetRoomById(numericId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "❌ Room not found",
      });
    }

    res.json({
      success: true,
      message: "✅ Get room by ID successfully",
      data: room,
    });
  } catch (error) {
    console.error("roomscontroller.updateRoom error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: related record not found",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 CREATE room
export const createRoom = async (req, res) => {
  try {
    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check trùng tên phòng tuyệt đối
    if (name) {
      const exists = await existsRoomWithName(name);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
    }

    // ensure numeric fields are numbers for the model
    const payload = { ...req.body, type_id: numericTypeId };
    const newRoom = await modelCreateRoom(payload);
    res.status(201).json({
      success: true,
      message: "✅ Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 UPDATE room
export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check trùng tên phòng tuyệt đối (exclude ID hiện tại)
    if (name) {
      const exists = await existsRoomWithName(name, numericId);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
    }

    const payload = { ...req.body };
    if (numericTypeId !== undefined) payload.type_id = numericTypeId;
    const updated = await modelUpdateRoom(numericId, payload);
    res.json({
      success: true,
      message: "✅ Room updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🗑️ DELETE room
export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    const deleted = await modelDeleteRoom(numericId);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    res.json({
      success: true,
      message: "✅ Room deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("roomscontroller.deleteRoom error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: cannot delete",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
