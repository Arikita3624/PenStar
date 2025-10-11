import Joi from "joi";

const FloorSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string().required(),
  building_id: Joi.number().positive().required(),
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
