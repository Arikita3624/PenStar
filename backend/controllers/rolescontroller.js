import {
  getRoles as modelGetRoles,
  getRoleById as modelGetRoleById,
  createRole as modelCreateRole,
  updateRole as modelUpdateRole,
  deleteRole as modelDeleteRole,
} from "../models/rolesmodel.js";

export const getRoles = async (req, res) => {
  try {
    const data = await modelGetRoles();
    res.json({ success: true, message: "✅ Get all roles successfully", data });
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

export const createRole = async (req, res) => {
  try {
    const { existsRoleWithName } = await import("../models/rolesmodel.js");
    const { name } = req.body;
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: "Role name is required" });
    if (await existsRoleWithName(String(name))) {
      return res
        .status(400)
        .json({ success: false, message: "Role name already exists" });
    }
    const created = await modelCreateRole(req.body);
    res
      .status(201)
      .json({
        success: true,
        message: "✅ Role created successfully",
        data: created,
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

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await modelGetRoleById(id);
    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, message: "✅ Get role", data: item });
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

export const updateRole = async (req, res) => {
  const { id } = req.params;
  try {
    const { existsRoleWithName } = await import("../models/rolesmodel.js");
    const { name } = req.body;
    if (name && (await existsRoleWithName(String(name), Number(id)))) {
      return res
        .status(400)
        .json({ success: false, message: "Role name already exists" });
    }
    const updated = await modelUpdateRole(id, req.body);
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, message: "✅ Role updated", data: updated });
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

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // optionally check references (users.role_id)
    const deleted = await modelDeleteRole(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    res.json({ success: true, message: "✅ Role deleted", data: deleted });
  } catch (error) {
    if (error && error.code === "23503") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot delete role in use",
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
