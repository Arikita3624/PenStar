import pool from "../db.js";

export const getDiscountCodes = async () => {
  const res = await pool.query(
    "SELECT * FROM discount_codes ORDER BY created_at DESC"
  );
  return res.rows;
};

// Get active discount codes (public - for customers)
export const getActiveDiscountCodes = async () => {
  const now = new Date();
  const res = await pool.query(
    `SELECT id, code, description, discount_type, discount_value, 
            min_order_amount, max_discount_amount, valid_from, valid_until
     FROM discount_codes 
     WHERE is_active = true 
       AND valid_from <= $1 
       AND valid_until >= $1
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ORDER BY created_at DESC
     LIMIT 10`,
    [now]
  );
  return res.rows;
};

export const getDiscountCodeById = async (id) => {
  const res = await pool.query(
    "SELECT * FROM discount_codes WHERE id = $1",
    [id]
  );
  return res.rows[0];
};

export const getDiscountCodeByCode = async (code) => {
  const res = await pool.query(
    "SELECT * FROM discount_codes WHERE code = $1 AND is_active = true",
    [code.toUpperCase()]
  );
  return res.rows[0];
};

export const createDiscountCode = async (data) => {
  const {
    code,
    description,
    discount_type, // 'percentage' or 'fixed'
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    used_count = 0,
    valid_from,
    valid_until,
    is_active = true,
  } = data;

  const res = await pool.query(
    `INSERT INTO discount_codes 
     (code, description, discount_type, discount_value, min_order_amount, 
      max_discount_amount, usage_limit, used_count, valid_from, valid_until, is_active, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
    [
      code.toUpperCase(),
      description,
      discount_type,
      discount_value,
      min_order_amount || 0,
      max_discount_amount || null,
      usage_limit || null,
      used_count,
      valid_from,
      valid_until,
      is_active,
    ]
  );
  return res.rows[0];
};

export const updateDiscountCode = async (id, data) => {
  const {
    code,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    valid_from,
    valid_until,
    is_active,
  } = data;

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (code !== undefined) {
    updates.push(`code = $${paramIndex++}`);
    values.push(code.toUpperCase());
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (discount_type !== undefined) {
    updates.push(`discount_type = $${paramIndex++}`);
    values.push(discount_type);
  }
  if (discount_value !== undefined) {
    updates.push(`discount_value = $${paramIndex++}`);
    values.push(discount_value);
  }
  if (min_order_amount !== undefined) {
    updates.push(`min_order_amount = $${paramIndex++}`);
    values.push(min_order_amount);
  }
  if (max_discount_amount !== undefined) {
    updates.push(`max_discount_amount = $${paramIndex++}`);
    values.push(max_discount_amount);
  }
  if (usage_limit !== undefined) {
    updates.push(`usage_limit = $${paramIndex++}`);
    values.push(usage_limit);
  }
  if (valid_from !== undefined) {
    updates.push(`valid_from = $${paramIndex++}`);
    values.push(valid_from);
  }
  if (valid_until !== undefined) {
    updates.push(`valid_until = $${paramIndex++}`);
    values.push(valid_until);
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (updates.length === 0) {
    return await getDiscountCodeById(id);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const res = await pool.query(
    `UPDATE discount_codes SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return res.rows[0];
};

export const deleteDiscountCode = async (id) => {
  const res = await pool.query(
    "DELETE FROM discount_codes WHERE id = $1 RETURNING *",
    [id]
  );
  return res.rows[0];
};

export const incrementUsageCount = async (code) => {
  const res = await pool.query(
    "UPDATE discount_codes SET used_count = used_count + 1 WHERE code = $1 RETURNING *",
    [code.toUpperCase()]
  );
  return res.rows[0];
};

export const validateDiscountCode = async (code, orderAmount) => {
  const discountCode = await getDiscountCodeByCode(code);
  
  if (!discountCode) {
    return {
      valid: false,
      message: "Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa",
    };
  }

  const now = new Date();
  const validFrom = new Date(discountCode.valid_from);
  const validUntil = new Date(discountCode.valid_until);

  // Check validity period
  if (now < validFrom) {
    return {
      valid: false,
      message: "Mã giảm giá chưa có hiệu lực",
    };
  }

  if (now > validUntil) {
    return {
      valid: false,
      message: "Mã giảm giá đã hết hạn",
    };
  }

  // Check usage limit
  if (
    discountCode.usage_limit !== null &&
    discountCode.used_count >= discountCode.usage_limit
  ) {
    return {
      valid: false,
      message: "Mã giảm giá đã hết lượt sử dụng",
    };
  }

  // Check minimum order amount
  if (orderAmount < discountCode.min_order_amount) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${discountCode.min_order_amount.toLocaleString("vi-VN")} VNĐ để sử dụng mã này`,
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (discountCode.discount_type === "percentage") {
    discountAmount = (orderAmount * discountCode.discount_value) / 100;
    if (discountCode.max_discount_amount) {
      discountAmount = Math.min(discountAmount, discountCode.max_discount_amount);
    }
  } else {
    // fixed amount
    discountAmount = discountCode.discount_value;
  }

  return {
    valid: true,
    discountCode,
    discountAmount,
    finalAmount: orderAmount - discountAmount,
  };
};

export const existsDiscountCode = async (code, excludeId = null) => {
  if (excludeId) {
    const res = await pool.query(
      "SELECT 1 FROM discount_codes WHERE UPPER(code) = UPPER($1) AND id <> $2 LIMIT 1",
      [code, excludeId]
    );
    return res.rowCount > 0;
  }
  const res = await pool.query(
    "SELECT 1 FROM discount_codes WHERE UPPER(code) = UPPER($1) LIMIT 1",
    [code]
  );
  return res.rowCount > 0;
};

