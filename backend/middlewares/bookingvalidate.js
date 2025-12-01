import Joi from "joi";

export const bookingItemSchema = Joi.object({
  booking_id: Joi.number().positive().required(),
  room_id: Joi.number().positive().required(),
  room_type_id: Joi.number().positive().required(),
  check_in: Joi.string().isoDate().required(),
  check_out: Joi.string().isoDate().required(),
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
  customer_email: Joi.any().optional(), // Ignored - email stored in users table
  customer_phone: Joi.any().optional(), // Ignored - phone stored in users table
  email: Joi.any().optional(), // Legacy
  phone: Joi.any().optional(), // Legacy
  notes: Joi.any().optional(), // Ignored
  promo_code: Joi.any().optional(), // Ignored
  num_adults: Joi.number().integer().min(1).max(20).optional(), // Số người lớn (root level)
  num_children: Joi.number().integer().min(0).max(20).optional(), // Số trẻ em (root level)
  total_price: Joi.number().min(0).required(),
  payment_status: Joi.string().required(),
  payment_method: Joi.string()
    .valid("cash", "card", "transfer", "momo", "vnpay", "cod")
    .optional(), // Phương thức thanh toán
  booking_method: Joi.string().required(),
  stay_status_id: Joi.number().positive().required(),
  // user_id will be taken from req.user if not provided
  user_id: Joi.number().positive().optional(),
  // Cho phép items hoặc rooms_config (autoAssign)
  items: Joi.array()
    .items(
      Joi.object({
        room_id: Joi.number().positive().required(),
        check_in: Joi.string().isoDate().required(),
        check_out: Joi.string().isoDate().required(),
        num_adults: Joi.number().integer().min(1).max(20).optional(),
        num_children: Joi.number().integer().min(0).max(20).optional(),
        guests: Joi.array()
          .items(
            Joi.object({
              guest_name: Joi.string().required(),
              guest_type: Joi.string().valid("adult", "child").required(),
              age: Joi.number().integer().min(0).max(120).optional(),
              is_primary: Joi.boolean().required(),
            })
          )
          .optional(),
        services: Joi.array()
          .items(
            Joi.object({
              service_id: Joi.number().positive().required(),
              quantity: Joi.number().integer().min(1).required(),
              total_service_price: Joi.number().min(0).required(),
            })
          )
          .optional(),
      })
    )
    .min(1)
    .optional(),
  rooms_config: Joi.array()
    .items(
      Joi.object({
        room_type_id: Joi.number().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        check_in: Joi.string().isoDate().required(),
        check_out: Joi.string().isoDate().required(),
        room_type_price: Joi.number().min(0).required(),
        num_adults: Joi.number().integer().min(1).max(20).optional(),
        num_children: Joi.number().integer().min(0).max(20).optional(),
        services: Joi.array()
          .items(
            Joi.object({
              service_id: Joi.number().positive().required(),
              quantity: Joi.number().integer().min(1).required(),
              total_service_price: Joi.number().min(0).required(),
            })
          )
          .optional(),
      })
    )
    .min(1)
    .optional(),
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
  console.log("📝 Validating booking data:", JSON.stringify(req.body, null, 2));
  // Custom validation: phải có ít nhất 1 trong 2 trường items hoặc rooms_config
  const { items, rooms_config } = req.body;
  if (!Array.isArray(items) && !Array.isArray(rooms_config)) {
    return res
      .status(400)
      .json({ success: false, message: "items hoặc rooms_config is required" });
  }
  const { value, error } = bookingCreateSchema.validate(req.body, {
    abortEarly: true,
  });
  if (error) {
    console.log("❌ Validation error:", error.details[0].message);
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  }
  console.log("✅ Validation passed");
  req.body = value;
  next();
};
