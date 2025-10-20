import { Button, Card, Spin, Tag } from "antd";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getRoomTypeById } from "@/services/roomTypeApi";
import { getFloorById } from "@/services/floorsApi";
import type { Room } from "@/types/room";
import { motion } from "framer-motion";

const RoomDetail = () => {
  const { id } = useParams();
  const { data: room, isLoading } = useQuery<Room | null>({
    queryKey: ["rooms", id],
    queryFn: () => getRoomID(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: roomType } = useQuery({
    queryKey: ["room_type", room?.type_id],
    queryFn: () => getRoomTypeById(String(room?.type_id ?? "")),
    enabled: Boolean(room?.type_id),
  });

  const { data: floor } = useQuery({
    queryKey: ["floor", room?.floor_id],
    queryFn: () => getFloorById(String(room?.floor_id ?? "")),
    enabled: Boolean(room?.floor_id),
  });

  if (isLoading)
    return (
      <div className="text-center py-12">
        <Spin />
      </div>
    );
  if (!room)
    return <div className="text-center py-12">Không tìm thấy phòng</div>;

  const obj = room as unknown as Record<string, unknown>;
  const img = String(obj.thumbnail ?? obj.image ?? "/room-default.jpg");
  const title = String(obj.name ?? obj.number ?? `Phòng ${obj.id ?? ""}`);
  const desc = obj.description ? String(obj.description) : "";
  const price = Number(obj.price ?? 0);
  const status = String(obj.status ?? "").toLowerCase();

  const statusMeta: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    available: { bg: "bg-green-50", text: "text-green-600", label: "Sẵn có" },
    occupied: { bg: "bg-red-50", text: "text-red-600", label: "Đã đặt" },
    cleaning: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      label: "Đang dọn",
    },
    "under maintenance": {
      bg: "bg-orange-50",
      text: "text-orange-600",
      label: "Bảo trì",
    },
    active: { bg: "bg-blue-50", text: "text-blue-600", label: "Hoạt động" },
  };

  const st = statusMeta[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: String(obj.status ?? "—"),
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* --- Page Title --- */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#0a4f86]">Chi tiết phòng</h1>
        <p className="text-gray-600 mt-2">
          Thông tin chi tiết và tiện nghi của phòng bạn chọn
        </p>
      </div>

      <Card className="ps-card shadow-lg rounded-xl p-8">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="md:w-1/2 overflow-hidden rounded-xl"
          >
            <img
              src={img}
              alt={title}
              className="w-full h-[45rem] object-cover rounded-xl transform hover:scale-105 transition duration-300"
            />
          </motion.div>

          {/* Right: Details */}
          <div className="md:flex-1 flex flex-col justify-between">
            <div>
              {/* Title & Short Description */}
              <h2 className="text-3xl font-bold text-[#0a4f86]">{title}</h2>
              <p className="text-gray-600 mt-3 text-base leading-7 whitespace-pre-wrap">
                {desc ||
                  "Phòng nghỉ tiện nghi, lý tưởng cho kỳ nghỉ dưỡng thoải mái."}
              </p>

              {/* Price Section */}
              <div className="mt-6 mb-6 flex flex-col gap-2">
                <span className="text-gray-400 line-through text-lg">
                  1.500.000 ₫
                </span>
                <span className="text-4xl font-bold text-[#0a66a3]">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(price)}
                </span>
                <span className="text-green-600 font-medium">
                  ✅ Miễn phí hủy · Bao gồm bữa sáng
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10 text-sm text-gray-800 border-t pt-6">
                <div>
                  <div className="font-medium text-gray-500">Sức chứa</div>
                  <div className="mt-1 text-lg font-semibold">
                    {String(obj.capacity ?? "—")} người
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Trạng thái</div>
                  <div className="mt-1">
                    <Tag className="!bg-transparent !border-0 !p-0 !m-0 !leading-none">
                      <span
                        className={`inline-block rounded-full px-4 py-1 text-sm font-medium ${st.bg} ${st.text}`}
                      >
                        {st.label}
                      </span>
                    </Tag>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Loại phòng</div>
                  <div className="mt-1 text-lg font-semibold">
                    {roomType?.name ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">Tầng</div>
                  <div className="mt-1 text-lg font-semibold">
                    {floor?.name ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">
                    Check-in / Check-out
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    14:00 - 12:00
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-500">
                    Chính sách hủy
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    Miễn phí trước 24h
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Tiện nghi đi kèm</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "WiFi",
                    "Máy lạnh",
                    "TV màn hình phẳng",
                    "Hồ bơi",
                    "Ban công",
                    "Bữa sáng miễn phí",
                  ].map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/rooms">
                <Button className="ps-btn-outline rounded-md px-6 h-11 text-base">
                  Quay lại
                </Button>
              </Link>
              <Link to={`/booking/create?room_id=${room.id}`}>
                <Button
                  type="primary"
                  className="ps-btn-primary rounded-md px-8 h-11 text-base"
                >
                  Đặt phòng
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoomDetail;
