import Joi from "joi";

const roomSchema = Joi.object({
  name: Joi.string().required(),
  type_id: Joi.number().positive().required(),
  short_desc: Joi.string().required(),
  long_desc: Joi.string().required(),
  status: Joi.string().required(),
  thumbnail: Joi.string().required(),
  floor_id: Joi.number().positive().required(),
});

export const validateRoomCreate = (req, res, next) => {
  // For create, allow thumbnail to be optional (frontend may upload later)
  const createSchema = roomSchema.fork(["thumbnail"], (field) =>
    field.optional()
  );
  const { value, error } = createSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  // Use the validated/coerced values from Joi (e.g., string->number conversions)
  req.body = value;
  next();
};

export const validateRoomUpdate = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id)))
    return res.status(400).json({ message: "Invalid ID" });

  // Cho phép update partial
  const partialSchema = roomSchema.fork(
    Object.keys(roomSchema.describe().keys),
    (field) => field.optional()
  );
  const { value, error } = partialSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  // assign validated/coerced values back to req.body for downstream handlers
  req.body = value;
  next();
};

export const validateRoomIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  next();
};
