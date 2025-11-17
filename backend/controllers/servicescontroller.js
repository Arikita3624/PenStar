import {
  getServices as modelGetServices,
  getServiceById as modelGetServicesId,
  createService as modelCreateService,
  updateService as modelUpdateService,
  deleteService as modelDeleteService,
} from "../models/servicesmodel.js";

export const getServices = async (req, res) => {
  try {
    const data = await modelGetServices();
    res.json({
      success: true,
      message: "✅ Get all services successfully",
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
export const getServiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await modelGetServicesId(id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    res.json({
      success: true,
      message: "✅ Get service by ID successfully",
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
export const createService = async (req, res) => {
  try {
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const { name } = req.body;
    if (await existsServiceWithName(String(name))) {
      return res
        .status(400)
        .json({ success: false, message: "Service name already exists" });
    }
    const newService = await modelCreateService(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Service created successfully",
      data: newService,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
export const updateService = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const { name } = req.body;
    if (name && (await existsServiceWithName(String(name), Number(id)))) {
      return res
        .status(400)
        .json({ success: false, message: "Service name already exists" });
    }
    const updated = await modelUpdateService(id, req.body);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    res.json({
      success: true,
      message: "✅ Service updated successfully",
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

export const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await modelDeleteService(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "✅ Service deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

