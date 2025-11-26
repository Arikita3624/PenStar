import {
  getRoomTypes as modelGetRooomTypes,
  createRoomType as modelCreateRoomType,
  getRoomTypeById as modelGetRoomTypeById,
  updateRoomType as modelUpdateRoomType,
  deleteRoomType as modelDeleteRoomType,
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
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const { name } = req.body;
    if (await existsRoomTypeWithName(String(name))) {
      return res
        .status(400)
        .json({ success: false, message: "Room type name already exists" });
    }
    // Accept devices_id as array of device IDs
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

export const getRoomTypeById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetRoomTypeById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Room type not found" });
    res.json({ success: true, message: "✅ Get room type", data: item });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const updateRoomType = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsRoomTypeWithName } = await import(
      "../models/roomtypemodel.js"
    );
    const { name } = req.body;
    if (name && (await existsRoomTypeWithName(String(name), Number(id)))) {
      return res
        .status(400)
        .json({ success: false, message: "Room type name already exists" });
    }
    // Accept devices_id as array of device IDs
    const updated = await modelUpdateRoomType(id, req.body);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Room type not found" });
    res.json({ success: true, message: "✅ Room type updated", data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const deleteRoomType = async (req, res) => {
  const { id } = req.params;
  try {
    // check if any room uses this type
    const { countRoomsByTypeId } = await import("../models/roomsmodel.js");
    const count = await countRoomsByTypeId(id);
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room type: rooms still reference it",
      });
    }

    const deleted = await modelDeleteRoomType(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Room type not found" });
    res.json({ success: true, message: "✅ Room type deleted", data: deleted });
  } catch (error) {
    // handle FK violation
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room type in use",
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
