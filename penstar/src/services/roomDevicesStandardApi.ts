import { instance } from "./api";

// Kiểm tra tiêu chuẩn thiết bị cho tất cả phòng thuộc một loại phòng
export const checkRoomDevicesStandardByType = async (roomTypeId) => {
  const res = await instance.get(
    `/room-devices/check-standard-by-type/${roomTypeId}`
  );
  return res.data;
};
