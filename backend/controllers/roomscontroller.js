import {
  getRooms as modelGetRooms,
  getRoomID as modelGetRoomById,
  createRoom as modelCreateRoom,
  updateRoom as modelUpdateRoom,
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
