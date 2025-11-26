export const validateDevice = (req, res, next) => {
  const { name, type, fee } = req.body;
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Device name is required" });
  }
  if (type && typeof type !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Device type must be a string" });
  }
  if (fee && isNaN(Number(fee))) {
    return res
      .status(400)
      .json({ success: false, message: "Device fee must be a number" });
  }
  next();
};
