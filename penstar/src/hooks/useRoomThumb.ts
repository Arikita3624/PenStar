import { useQuery } from "@tanstack/react-query";
import { getImagesByRoom } from "@/services/roomImagesApi";
import type { RoomImage } from "@/types/roomImage";

export const useRoomThumb = (roomId?: number) => {
  return useQuery<RoomImage[]>({
    queryKey: ["room_thumb", roomId],
    queryFn: () => (roomId ? getImagesByRoom(roomId) : Promise.resolve([])),
    enabled: !!roomId,
    select: (images) => images.filter((img) => img.is_thumbnail),
  });
};
