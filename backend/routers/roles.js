import express from "express";
import {
  getRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/rolescontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// roles management should be restricted to admin users
router.get("/", requireAuth, requireRole("admin"), getRoles);
router.post("/", requireAuth, requireRole("admin"), createRole);
router.get("/:id", requireAuth, requireRole("admin"), getRoleById);
router.put("/:id", requireAuth, requireRole("admin"), updateRole);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRole);

export default router;
