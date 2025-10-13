import Joi from "joi";

const roomTypeSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
});

export const validateRoomTypeCreate = (req, res, next) => {
  const { error } = roomTypeSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};
