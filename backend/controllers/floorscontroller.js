import {
  getFloors as modelGetFloors,
  getFloorID as modelGetFloorID,
  createFloor as modelCreateFloor,
  updateFloor as modelUpdateFloor,
  deleteFloor as modelDeleteFloor,
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

export const updateFloor = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await modelUpdateFloor(id, req.body);
    res.json({
      success: true,
      message: "✅ Floor updated successfully",
      data: updated,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "🚨 Internal server error",
        error: error.message,
      });
  }
};

export const deleteFloor = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteFloor(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Floor not found" });
    res.json({
      success: true,
      message: "✅ Floor deleted successfully",
      data: deleted,
    });
  } catch (error) {
    // handle FK constraint
    if (error && error.code === "23503") {
      return res
        .status(400)
        .json({
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
