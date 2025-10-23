import express from "express";
import {
  createFloor,
  getFloorID,
  getFloors,
  updateFloor,
  deleteFloor,
} from "../controllers/floorscontroller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const FloorsRouter = express.Router();

// Public: list and read floors
FloorsRouter.get("/", getFloors);
FloorsRouter.get("/:id", getFloorID);
FloorsRouter.post("/", requireAuth, requireRole("staff"), createFloor);
// Check if a floor name exists (query: name, excludeId)
FloorsRouter.get("/check-name", async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    if (!name)
      return res.status(400).json({ success: false, message: "name required" });
    const { existsFloorWithName } = await import("../models/floorsmodel.js");
    const exists = await existsFloorWithName(
      String(name),
      excludeId ? Number(excludeId) : null
    );
    return res.json({ success: true, exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
FloorsRouter.put("/:id", requireAuth, requireRole("staff"), updateFloor);
FloorsRouter.delete("/:id", requireAuth, requireRole("staff"), deleteFloor);

export default FloorsRouter;
