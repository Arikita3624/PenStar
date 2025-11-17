import { getStayStatuses as fetchStayStatuses } from "../models/staystatusmodel.js";

export const getStayStatuses = async (req, res) => {
  try {
    const data = await fetchStayStatuses();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default { getStayStatuses };
