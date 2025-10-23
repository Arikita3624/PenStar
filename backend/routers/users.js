import express from "express";
import {
  register,
  login,
  listUsers,
  updateUserController,
} from "../controllers/userscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// list and update users require admin
router.get("/", requireAuth, requireRole("admin"), listUsers);
router.put("/:id", requireAuth, requireRole("admin"), updateUserController);

export default router;
