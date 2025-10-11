import {
  getRoomTypes as modelGetRooomTypes,
  createRoomType as modelCreateRoomType,
} from "../models/roomtypemodel.js";

export const getRoomTypes = async (req, res) => {
  try {
    const data = await modelGetRooomTypes();
    res.json({
      success: true,
      message: "✅ Get all room types successfully",
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

export const createRoomType = async (req, res) => {
  try {
    const newRoomType = await modelCreateRoomType(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Room type created successfully",
      data: newRoomType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
