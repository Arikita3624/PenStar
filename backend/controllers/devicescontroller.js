import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
} from "../models/devicesmodel.js";

export const getAllDevices = async (req, res) => {
  try {
    const devices = await getDevices();
    res.json({ success: true, data: devices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDevice = async (req, res) => {
  try {
    const device = await getDeviceById(req.params.id);
    if (!device)
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createDeviceHandler = async (req, res) => {
  try {
    const device = await createDevice(req.body);
    res.status(201).json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDeviceHandler = async (req, res) => {
  try {
    const device = await updateDevice(req.params.id, req.body);
    if (!device)
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteDeviceHandler = async (req, res) => {
  try {
    const device = await deleteDevice(req.params.id);
    if (!device)
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    res.json({ success: true, data: device });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
