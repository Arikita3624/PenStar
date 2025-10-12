import {
  getRooms as modelGetRooms,
  getRoomID as modelGetRoomById,
  createRoom as modelCreateRoom,
  updateRoom as modelUpdateRoom,
  deleteRoom as modelDeleteRoom,
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
  try {
    const room = await modelGetRoomById(id);
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
    const newRoom = await modelCreateRoom(req.body);
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
  try {
    const updated = await modelUpdateRoom(id, req.body);
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
  try {
    const deleted = await modelDeleteRoom(id);
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
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};
