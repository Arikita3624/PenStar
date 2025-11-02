import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getRoomTypeById } from "@/services/roomTypeApi";
import { getFloorById } from "@/services/floorsApi";
import { getImagesByRoom } from "@/services/roomImagesApi";
import type { Room } from "@/types/room";
import type { RoomImage } from "@/types/roomImage";

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

  // Fetch room images
  const { data: images = [] } = useQuery<RoomImage[]>({
    queryKey: ["roomImages", room?.id],
    queryFn: () => getImagesByRoom(Number(room?.id)),
    enabled: Boolean(room?.id),
  });
  // slider state (declare hooks unconditionally)
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  useEffect(() => {
    // reset to first slide if room's thumbnail or images change
    setCurrentSlide(0);
  }, [room?.thumbnail, images.length]);

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
  const desc = obj.long_desc ? String(obj.long_desc) : "";
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
    pending: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "Đã có người đặt",
    },
    booked: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Đã đặt" },
    occupied: { bg: "bg-red-100", text: "text-red-700", label: "Đang ở" },
    cleaning: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      label: "Đang dọn",
    },
    maintenance: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "Bảo trì",
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
  // helper: strip tags for short description
  const stripTags = (html?: string) => {
    if (!html) return "";
    return String(html)
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  // Basic sanitizer: remove script/style tags and on* attributes to reduce XSS risk
  const sanitizeHtml = (html?: string) => {
    if (!html) return "";
    // remove script and style blocks
    let s = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
    // remove on* attributes like onclick
    s = s.replace(/on[a-z]+\s*=\s*"[^"]*"/gi, "");
    s = s.replace(/on[a-z]+\s*=\s*'[^']*'/gi, "");
    s = s.replace(/on[a-z]+\s*=\s*[^\s>]+/gi, "");
    return s;
  };

  // prepare gallery images: exclude thumbnail and dedupe by URL
  const galleryImages = (() => {
    const seen = new Set<string>();
    return images
      .filter((im) => !im.is_thumbnail && im.image_url !== img)
      .filter((im) => {
        if (!im.image_url) return false;
        if (seen.has(im.image_url)) return false;
        seen.add(im.image_url);
        return true;
      });
  })();

  // build slides: extras only (main thumbnail will be shown above)
  const extras = galleryImages.map((g) => g.image_url);

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
            {/* Left: Large thumbnail area and compact extras gallery below (design-like) */}
            <div className="relative flex flex-col lg:pr-6">
              {/* Main image area: make it tall and centered */}
              <div className="h-[520px] lg:h-[620px] w-full bg-gray-100 rounded overflow-hidden relative">
                <img
                  src={
                    extras.length > 0
                      ? extras[currentSlide % extras.length]
                      : img
                  }
                  alt={title}
                  className="w-full h-full object-cover"
                />

                {/* Left large overlay Prev arrow */}
                <button
                  aria-label="Prev"
                  onClick={() =>
                    setCurrentSlide((s) =>
                      extras.length > 0
                        ? s <= 0
                          ? extras.length - 1
                          : s - 1
                        : 0
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-2xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                >
                  ‹
                </button>

                {/* Right large overlay Next arrow */}
                <button
                  aria-label="Next"
                  onClick={() =>
                    setCurrentSlide((s) =>
                      extras.length > 0
                        ? s >= extras.length - 1
                          ? 0
                          : s + 1
                        : 0
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-2xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                >
                  ›
                </button>

                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  <span
                    className={`${st.bg} ${st.text} px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                  >
                    {st.label}
                  </span>
                </div>
              </div>

              {/* Thumbnails row (compact) */}
              <div className="mt-4 flex items-center gap-3">
                {extras.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {extras.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`flex-shrink-0 overflow-hidden rounded-lg border ${
                          idx === currentSlide % extras.length
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-transparent"
                        }`}
                        aria-label={`Go to extra ${idx + 1}`}
                      >
                        <img
                          src={s}
                          alt={`thumb-${idx}`}
                          className="w-36 h-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Không có ảnh phụ</div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="p-8 lg:p-12 flex flex-col">
              <div className="flex-1">
                {/* Title */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                  {title}
                </h1>

                {/* Short description (shown here). Long description moved below images. */}
                <div className="text-gray-600 text-base leading-relaxed mb-6">
                  {String(obj.short_desc ?? "").trim() ? (
                    <p className="text-gray-700 mb-4">
                      {stripTags(String(obj.short_desc))}
                    </p>
                  ) : (
                    !desc && (
                      <p>
                        Phòng nghỉ tiện nghi, lý tưởng cho kỳ nghỉ dưỡng thoải
                        mái.
                      </p>
                    )
                  )}
                </div>

                {/* Price Section */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
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

        {/* Gallery moved into slider above */}

        {/* Long description (rendered as HTML) */}
        {desc && (
          <div className="container mx-auto px-4 py-8">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Mô tả chi tiết
            </h3>
            <div
              className="bg-white rounded-xl p-6 shadow-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(desc) }}
            />
          </div>
        )}

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
