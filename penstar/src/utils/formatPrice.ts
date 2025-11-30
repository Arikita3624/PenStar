/**
 * Format giá tiền theo chuẩn Việt Nam
 * @param price - Giá tiền cần format (number hoặc string)
 * @returns Chuỗi giá tiền đã được format (ví dụ: "7.120.000 ₫")
 */
export const formatPrice = (price: number | string | undefined | null): string => {
  if (price == null || price === "") return "0 ₫";
  
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : Number(price);
  
  if (isNaN(numPrice) || numPrice < 0) return "0 ₫";
  
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numPrice);
};

/**
 * Format giá tiền không có ký hiệu tiền tệ
 * @param price - Giá tiền cần format
 * @returns Chuỗi giá tiền chỉ có số với dấu phẩy (ví dụ: "7.120.000")
 */
export const formatPriceNumber = (price: number | string | undefined | null): string => {
  if (price == null || price === "") return "0";
  
  const numPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.-]/g, "")) : Number(price);
  
  if (isNaN(numPrice) || numPrice < 0) return "0";
  
  return new Intl.NumberFormat("vi-VN").format(numPrice);
};

