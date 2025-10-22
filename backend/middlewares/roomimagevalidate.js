import Joi from "joi";

const roomImageSchema = Joi.object({
  room_id: Joi.number().integer().required(),
  image_url: Joi.string().uri().required(),
  is_thumbnail: Joi.boolean().required(),
});

export const validateRoomImageCreate = (req, res, next) => {
  const { value, error } = roomImageSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  req.body = value;
  next();
};

export const validateRoomImageUpdate = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  // allow partial update
  const partialSchema = roomImageSchema.fork(
    Object.keys(roomImageSchema.describe().keys),
    (field) => field.optional()
  );
  const { value, error } = partialSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  req.body = value;
  next();
};
