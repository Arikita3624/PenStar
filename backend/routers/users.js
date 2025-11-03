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
// list and update users require manager or higher
router.get("/", requireAuth, requireRole("manager"), listUsers);
router.put("/:id", requireAuth, requireRole("manager"), updateUserController);

export default router;
