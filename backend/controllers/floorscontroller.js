import {
  getFloors as modelGetFloors,
  getFloorID as modelGetFloorID,
  createFloor as modelCreateFloor,
} from "../models/floorsmodel.js";

export const getFloors = async (req, res) => {
  try {
    const data = await modelGetFloors();
    res.json({
      success: true,
      message: "✅ Get all floors successfully",
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

export const getFloorID = async (req, res) => {
  const { id } = req.params;
  try {
    const floor = await modelGetFloorID(id);
    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "❌ Floor not found",
      });
    }
    res.json({
      success: true,
      message: "✅ Get floor by ID successfully",
      data: floor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createFloor = async (req, res) => {
  try {
    const newFloor = await modelCreateFloor(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Floor created successfully",
      data: newFloor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
