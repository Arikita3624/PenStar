import api from "./api";

export interface RoomTypeImage {
  id: number;
  room_type_id: number;
  image_url: string;
  is_thumbnail: boolean;
  created_at: string;
  updated_at: string;
}

export const getImagesByRoomType = async (
  roomTypeId: number
): Promise<RoomTypeImage[]> => {
  const response = await api.get(`/roomtype-images/roomtype/${roomTypeId}`);
  return response.data.data;
};

export const uploadRoomTypeImage = async (
  roomTypeId: number,
  file: File,
  isThumbnail: boolean = false
): Promise<RoomTypeImage> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_thumbnail", isThumbnail.toString());

  const response = await api.post(
    `/roomtype-images/roomtype/${roomTypeId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

export const deleteRoomTypeImage = async (imageId: number): Promise<void> => {
  await api.delete(`/roomtype-images/${imageId}`);
};
