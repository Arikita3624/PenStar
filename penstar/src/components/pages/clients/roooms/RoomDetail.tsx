import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getRoomTypeById } from "@/services/roomTypeApi";
import { getFloorById } from "@/services/floorsApi";
import type { Room } from "@/types/room";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  if (!room)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-600 text-lg">Không tìm thấy phòng</p>
          <Link to="/rooms">
            <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Quay lại danh sách
            </button>
          </Link>
        </div>
      </div>
    );

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
    available: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Sẵn sàng",
    },
    booked: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Đã đặt" },
    occupied: { bg: "bg-red-100", text: "text-red-700", label: "Đang ở" },
    cleaning: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      label: "Đang dọn",
    },
    unavailable: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "Tạm ngưng",
    },
  };

  const st = statusMeta[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: String(obj.status ?? "—"),
  };

  const stripHtml = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition">
              Trang chủ
            </Link>
            <span>/</span>
            <Link to="/rooms" className="hover:text-blue-600 transition">
              Danh sách phòng
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">{title}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Image Gallery */}
            <div className="relative h-[400px] lg:h-auto">
              <img
                src={img}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`${st.bg} ${st.text} px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                >
                  {st.label}
                </span>
              </div>
              {/* Rating Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-yellow-400 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  5.0
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="flex-1">
                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                  {title}
                </h1>

                {/* Description */}
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  {stripHtml(desc) ||
                    "Phòng nghỉ tiện nghi, lý tưởng cho kỳ nghỉ dưỡng thoải mái."}
                </p>

                {/* Price Section */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-gray-400 line-through text-lg">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(price * 1.5)}
                    </span>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      GIẢM 33%
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(price)}
                    <span className="text-lg text-gray-600 font-normal">
                      {" "}
                      / đêm
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Miễn phí hủy
                    </span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Bao gồm bữa sáng
                    </span>
                  </div>
                </div>

                {/* Room Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <div className="text-gray-500 text-sm mb-1">Sức chứa</div>
                    <div className="text-xl font-bold text-gray-800">
                      {String(obj.capacity ?? "2")} người
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-gray-500 text-sm mb-1">Loại phòng</div>
                    <div className="text-xl font-bold text-gray-800">
                      {roomType?.name ?? "—"}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-gray-500 text-sm mb-1">Tầng</div>
                    <div className="text-xl font-bold text-gray-800">
                      {floor?.name ?? "—"}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-gray-500 text-sm mb-1">Check-in</div>
                    <div className="text-xl font-bold text-gray-800">14:00</div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Tiện nghi phòng
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: "📶", text: "WiFi miễn phí" },
                      { icon: "❄️", text: "Điều hòa nhiệt độ" },
                      { icon: "📺", text: "TV màn hình phẳng" },
                      { icon: "🏊", text: "Hồ bơi" },
                      { icon: "🍳", text: "Bữa sáng buffet" },
                      { icon: "🅿️", text: "Bãi đỗ xe" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-gray-700"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t">
                <Link to="/rooms" className="flex-1 min-w-[200px]">
                  <button className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
                    ← Quay lại
                  </button>
                </Link>
                <Link
                  to={`/booking/create?room_id=${room.id}`}
                  className="flex-1 min-w-[200px]"
                >
                  <button className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-lg">
                    Đặt phòng ngay
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">
              Nhận phòng linh hoạt
            </h3>
            <p className="text-sm text-gray-600">
              Check-in từ 14:00, check-out trước 12:00. Hỗ trợ trả phòng muộn.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Hủy miễn phí</h3>
            <p className="text-sm text-gray-600">
              Hủy miễn phí trước 24h. Hoàn tiền 100% nếu hủy sớm.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Hỗ trợ 24/7</h3>
            <p className="text-sm text-gray-600">
              Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ mọi lúc mọi nơi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
