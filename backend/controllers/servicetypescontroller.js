import {
  getServiceTypes as modelGetServiceTypes,
  getServiceTypeByCode as modelGetServiceTypeByCode,
  createServiceType as modelCreateServiceType,
  updateServiceType as modelUpdateServiceType,
  deleteServiceType as modelDeleteServiceType,
} from "../models/servicetypesmodel.js";

export const getServiceTypes = async (req, res) => {
  try {
    const data = await modelGetServiceTypes();
    res.json({
      success: true,
      message: "✅ Get all service types successfully",
      data,
    });
  } catch (error) {
    console.error("servicetypescontroller.getServiceTypes error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const getServiceTypeByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelGetServiceTypeByCode(code);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }
    res.json({
      success: true,
      message: "✅ Get service type successfully",
      data,
    });
  } catch (error) {
    console.error("servicetypescontroller.getServiceTypeByCode error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const createServiceType = async (req, res) => {
  try {
    const data = await modelCreateServiceType(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Service type created successfully",
      data,
    });
  } catch (error) {
    console.error("servicetypescontroller.createServiceType error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const updateServiceType = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelUpdateServiceType(code, req.body);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }
    res.json({
      success: true,
      message: "✅ Service type updated successfully",
      data,
    });
  } catch (error) {
    console.error("servicetypescontroller.updateServiceType error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

export const deleteServiceType = async (req, res) => {
  const { code } = req.params;
  try {
    const data = await modelDeleteServiceType(code);
    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Service type not found",
      });
    }
    res.json({
      success: true,
      message: "✅ Service type deleted successfully",
      data,
    });
  } catch (error) {
    console.error("servicetypescontroller.deleteServiceType error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};
