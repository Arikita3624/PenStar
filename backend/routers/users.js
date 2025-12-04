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
router.get("/me", requireAuth, async (req, res) => {
  // return full profile for authenticated user
  try {
    const { getUserById } = await import("../models/usersmodel.js");
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password;
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// list and update users require manager or higher
router.get("/", requireAuth, requireRole("manager"), listUsers);
router.put("/:id", requireAuth, requireRole("manager"), updateUserController);

export default router;
