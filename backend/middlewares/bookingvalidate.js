import Joi from "joi";

export const bookingItemSchema = Joi.object({
  booking_id: Joi.number().positive().required(),
  room_id: Joi.number().positive().required(),
  check_in: Joi.string().isoDate().required(),
  check_out: Joi.string().isoDate().required(),
  room_price: Joi.number().min(0).required(),
});

export const bookingServiceSchema = Joi.object({
  booking_id: Joi.number().positive().required(),
  service_id: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  total_service_price: Joi.number().min(0).required(),
});

export const validateBookingItemCreate = (req, res, next) => {
  const { value, error } = bookingItemSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  req.body = value;
  next();
};

export const validateBookingServiceCreate = (req, res, next) => {
  const { value, error } = bookingServiceSchema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  req.body = value;
  next();
};

// Booking create schema: require customer_name, total_price, payment_status, booking_method
export const bookingCreateSchema = Joi.object({
  customer_name: Joi.string().required(),
  total_price: Joi.number().min(0).required(),
  payment_status: Joi.string().required(),
  booking_method: Joi.string().required(),
  stay_status_id: Joi.number().positive().required(),
  // user_id will be taken from req.user if not provided
  user_id: Joi.number().positive().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        room_id: Joi.number().positive().required(),
        check_in: Joi.string().isoDate().required(),
        check_out: Joi.string().isoDate().required(),
        room_price: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
  services: Joi.array()
    .items(
      Joi.object({
        service_id: Joi.number().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        total_service_price: Joi.number().min(0).required(),
      })
    )
    .optional(),
});

export const validateBookingCreate = (req, res, next) => {
  const { value, error } = bookingCreateSchema.validate(req.body, {
    abortEarly: true,
  });
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  req.body = value;
  next();
};
