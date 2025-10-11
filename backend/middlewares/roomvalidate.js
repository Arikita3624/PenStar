import Joi from "joi";

const roomSchema = Joi.object({
  name: Joi.string().required(),
  type_id: Joi.number().positive().required(),
  price: Joi.number().min(0).required(),
  capacity: Joi.number().positive().required(),
  description: Joi.string().required(),
  status: Joi.string().required(),
  thumbnail: Joi.string().required(),
  floor: Joi.number().positive().required(),
});

export const validateRoomCreate = (req, res, next) => {
  const { error } = roomSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateRoomUpdate = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id)))
    return res.status(400).json({ message: "Invalid ID" });

  // Cho phép update partial
  const { error } = roomSchema
    .fork(Object.keys(roomSchema.describe().keys), (field) => field.optional())
    .validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateRoomIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};
