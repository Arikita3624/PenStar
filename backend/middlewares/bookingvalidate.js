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
  booking_item_id: Joi.number().positive().optional().allow(null), // Optional: để thêm dịch vụ cho từng phòng
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
  // ...existing code...
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
        check_in: Joi.string()
          .isoDate()
          .required()
          .custom((value, helpers) => {
            const checkInDate = new Date(value);
            const now = new Date();
            const isToday = checkInDate.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            if (
              isToday &&
              (currentHour < 14 || (currentHour === 14 && currentMinute < 0))
            ) {
              return helpers.message(
                "Check-in từ 12:00. Vui lòng chọn ngày khác hoặc đợi đến 12:00."
              );
            }
            return value;
          }),
        check_out: Joi.string()
          .isoDate()
          .required()
          .custom((value, helpers) => {
            const checkOutDate = new Date(value);
            const now = new Date();
            const isToday = checkOutDate.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            if (isToday && currentHour >= 12) {
              return helpers.message(
                "Check-out trước 12:00. Vui lòng chọn ngày khác hoặc check-out trước 12:00."
              );
            }
            return value;
          }),
        num_adults: Joi.number().integer().min(1).max(20).optional(),
        num_children: Joi.number().integer().min(0).max(20).optional(),
        num_babies: Joi.number().integer().min(0).optional(),
        room_type_id: Joi.number().positive().required(),
        room_type_name: Joi.string().optional(),
        room_type_price: Joi.number().min(0).optional(),
        base_price: Joi.number().min(0).optional(),
        extra_fees: Joi.number().min(0).optional(),
        extra_adult_fees: Joi.number().min(0).optional(),
        extra_child_fees: Joi.number().min(0).optional(),
        extra_adults_count: Joi.number().integer().min(0).optional(),
        extra_children_count: Joi.number().integer().min(0).optional(),
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
        check_in: Joi.string()
          .isoDate()
          .required()
          .custom((value, helpers) => {
            const checkInDate = new Date(value);
            const now = new Date();
            const isToday = checkInDate.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            if (
              isToday &&
              (currentHour < 14 || (currentHour === 14 && currentMinute < 0))
            ) {
              return helpers.message(
                "Check-in từ 14:00. Vui lòng chọn ngày khác hoặc đợi đến 14:00."
              );
            }
            return value;
          }),
        check_out: Joi.string()
          .isoDate()
          .required()
          .custom((value, helpers) => {
            const checkOutDate = new Date(value);
            const now = new Date();
            const isToday = checkOutDate.toDateString() === now.toDateString();
            const currentHour = now.getHours();
            if (isToday && currentHour >= 12) {
              return helpers.message(
                "Check-out trước 12:00. Vui lòng chọn ngày khác hoặc check-out trước 12:00."
              );
            }
            return value;
          }),
        room_type_price: Joi.number().min(0).required(),
        num_adults: Joi.number().integer().min(1).max(20).optional(),
        num_children: Joi.number().integer().min(0).max(20).optional(),
        extra_fees: Joi.number().min(0).optional(),
        extra_adult_fees: Joi.number().min(0).optional(),
        extra_child_fees: Joi.number().min(0).optional(),
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

  // Validation: Giới hạn số người tối đa 4 (không tính em bé)
  const MAX_GUESTS_DEFAULT = 4;

  // Kiểm tra num_adults và num_children ở root level (nếu có)
  if (
    req.body.num_adults !== undefined ||
    req.body.num_children !== undefined
  ) {
    const numAdults = req.body.num_adults || 0;
    const numChildren = req.body.num_children || 0;
    const totalGuests = numAdults + numChildren;

    if (totalGuests > MAX_GUESTS_DEFAULT) {
      return res.status(400).json({
        success: false,
        message: `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé). Vui lòng chọn lại.`,
      });
    }
  }

  // Kiểm tra items
  if (Array.isArray(items)) {
    for (const item of items) {
      const numAdults = item.num_adults || 0;
      const numChildren = item.num_children || 0;
      const totalGuests = numAdults + numChildren;

      if (totalGuests > MAX_GUESTS_DEFAULT) {
        return res.status(400).json({
          success: false,
          message: `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé). Vui lòng chọn lại.`,
        });
      }
    }
  }

  // Kiểm tra rooms_config
  if (Array.isArray(rooms_config)) {
    for (const config of rooms_config) {
      const numAdults = config.num_adults || 0;
      const numChildren = config.num_children || 0;
      const totalGuests = numAdults + numChildren;

      if (totalGuests > MAX_GUESTS_DEFAULT) {
        return res.status(400).json({
          success: false,
          message: `Tổng số người (${totalGuests}) vượt quá giới hạn tối đa ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé). Vui lòng chọn lại.`,
        });
      }
    }
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
