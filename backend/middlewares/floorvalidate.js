import Joi from "joi";

const FloorSchema = Joi.object({
  // model createFloor currently expects { name, description }
  name: Joi.string().required(),
  description: Joi.string().required(),
});

export const validateFloorCreate = (req, res, next) => {
  const { error } = FloorSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};
