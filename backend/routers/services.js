import express from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/servicescontroller.js";
import {
  validateServiceCreate,
  validateServiceUpdate,
} from "../middlewares/servicevalidate.js";
const serviceRouter = express.Router();

serviceRouter.get("/", getServices);
// Check if a service name exists (query: name, excludeId)
serviceRouter.get("/check-name", async (req, res) => {
  try {
    const { name, excludeId } = req.query;
    if (!name)
      return res.status(400).json({ success: false, message: "name required" });
    const { existsServiceWithName } = await import(
      "../models/servicesmodel.js"
    );
    const exists = await existsServiceWithName(
      String(name),
      excludeId ? Number(excludeId) : null
    );
    return res.json({ success: true, exists });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
serviceRouter.get("/:id", getServiceById);
serviceRouter.post("/", validateServiceCreate, createService);
serviceRouter.put("/:id", validateServiceUpdate, updateService);
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;
