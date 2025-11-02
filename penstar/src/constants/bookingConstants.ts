// Độ tuổi quy chuẩn cho hệ thống đặt phòng
export const CHILD_AGE_LIMIT = 8; // Trẻ em: < 8 tuổi, Người lớn: >= 8 tuổi

// Helper function để kiểm tra loại khách dựa trên tuổi
export const getGuestType = (age: number): "adult" | "child" => {
  return age >= CHILD_AGE_LIMIT ? "adult" : "child";
};

// Helper function để validate tuổi
export const isValidChildAge = (age: number): boolean => {
  return age >= 0 && age < CHILD_AGE_LIMIT;
};

export const isValidAdultAge = (age: number): boolean => {
  return age >= CHILD_AGE_LIMIT && age <= 120;
};
