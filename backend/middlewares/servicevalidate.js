import Joi from "joi";

const ServiceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  // require strictly greater than 0
  price: Joi.number().greater(0).required(),
});

export const validateServiceCreate = (req, res, next) => {
  const { error } = ServiceSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

export const validateServiceUpdate = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  // Cho phep update partial
  const { error } = ServiceSchema.fork(
    Object.keys(ServiceSchema.describe().keys),
    (field) => field.optional()
  ).validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  next();
};

export default ServiceSchema;
