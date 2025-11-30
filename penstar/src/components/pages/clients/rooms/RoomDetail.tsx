/* eslint-disable @typescript-eslint/no-unused-vars */
import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoomID } from "@/services/roomsApi";
import { getRoomTypeById } from "@/services/roomTypeApi";
import { getFloorById } from "@/services/floorsApi";
import { getImagesByRoom } from "@/services/roomImagesApi";
import { message } from "antd";
import useAuth from "@/hooks/useAuth";
import RoomBookingModal from "@/components/common/RoomBookingModal";
import type { Room } from "@/types/room";
import type { RoomImage } from "@/types/roomImage";
import type { RoomType } from "@/types/roomtypes";
import type { Floors } from "@/types/floors";

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();

  const { data: room, isLoading } = useQuery<Room | null>({
    queryKey: ["rooms", id],
    queryFn: () => getRoomID(id ?? ""),
    enabled: Boolean(id),
  });

  const { data: roomType } = useQuery<RoomType | null>({
    queryKey: ["room_type", room?.type_id],
    queryFn: () => getRoomTypeById(String(room?.type_id ?? "")),
    enabled: Boolean(room?.type_id),
  });

  const { data: floor } = useQuery<Floors | null>({
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

  // Slider state
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  useEffect(() => {
    setCurrentSlide(0);
  }, [room?.thumbnail, images.length]);

  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  if (!room) {
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
  }

  // Safe access with fallbacks
  const img = room.thumbnail ?? "/room-default.jpg";
  const title = room.name ?? `Phòng ${room.id}`;
  const desc = room.long_desc ?? "";
  const price = Number(room.price ?? 0);
  const status = (room.status ?? "").toLowerCase();

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
    maintenance: { bg: "bg-blue-100", text: "text-blue-700", label: "Bảo trì" },
    unavailable: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "Tạm ngưng",
    },
  };

  const st = statusMeta[status] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: room.status ?? "—",
  };

  // Helper: strip HTML tags
  const stripTags = (html?: string) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  };

  // Basic XSS sanitizer
  const sanitizeHtml = (html?: string) => {
    if (!html) return "";
    // eslint-disable-next-line prefer-const
    let s = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, "")
      .replace(/on[a-z]+\s*=\s*'[^']*'/gi, "")
      .replace(/on[a-z]+\s*=\s*[^\s>]+/gi, "");
    return s;
  };

  // Prepare gallery images (exclude thumbnail, dedupe)
  const galleryImages = images
    .filter((im) => !im.is_thumbnail && im.image_url && im.image_url !== img)
    .reduce((acc: RoomImage[], im) => {
      if (!acc.some((x) => x.image_url === im.image_url)) {
        acc.push(im);
      }
      return acc;
    }, []);

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

      <div className="container mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Image Gallery */}
            <div className="relative flex flex-col lg:pr-4">
              <div className="h-[400px] lg:h-[500px] w-full bg-gray-100 rounded overflow-hidden relative">
                <img
                  src={
                    extras.length > 0
                      ? extras[currentSlide % extras.length]
                      : img
                  }
                  alt={title}
                  className="w-full h-full object-cover"
                />

                {/* Prev Button */}
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-3xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg leading-none"
                >
                  <span className="block -mt-1">‹</span>
                </button>

                {/* Next Button */}
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-3xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg leading-none"
                >
                  <span className="block -mt-1">›</span>
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

              {/* Thumbnail Strip */}
              <div className="mt-2 w-full px-4">
                {extras.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {extras.slice(0, 4).map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-full overflow-hidden rounded border-2 transition-all ${
                          idx === currentSlide % extras.length
                            ? "border-blue-600 ring-2 ring-blue-200 scale-95"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        aria-label={`Go to extra ${idx + 1}`}
                      >
                        <img
                          src={s}
                          alt={`thumb-${idx}`}
                          className="w-full h-16 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Không có ảnh phụ</div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="p-4 lg:p-6 flex flex-col">
              <div className="flex-1">
                {/* Title + Room Type */}
                <div className="mb-3">
                  <div className="flex itemsys-center gap-2 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                      {title}
                    </h1>
                  </div>
                  {roomType?.name && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-200">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-blue-700">
                        {roomType.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                {room.short_desc?.trim() ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {stripTags(room.short_desc)}
                    </p>
                  </div>
                ) : !desc ? (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Phòng nghỉ tiện nghi, lý tưởng cho kỳ nghỉ dưỡng thoải
                      mái.
                    </p>
                  </div>
                ) : null}

                {/* Price */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 mb-3 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>

                  <div className="relative z-10">
                    <div className="text-white/90 text-xs font-medium mb-1 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Giá phòng / đêm
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold text-white">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(roomType?.price || 0)}
                    </div>
                    <div className="mt-2 text-white/80 text-xs">
                      Đã bao gồm VAT & phí dịch vụ
                    </div>
                  </div>
                </div>

                {/* Room Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
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
                      <div className="text-orange-600 text-xs font-semibold">
                        Sức chứa
                      </div>
                    </div>
                    <div className="text-xl font-bold text-orange-900">
                      {roomType?.capacity ?? 2} người
                    </div>
                    {(roomType?.max_adults || roomType?.max_children) && (
                      <div className="text-xs text-orange-600 mt-0.5">
                        {roomType?.max_adults && (
                          <span>Tối đa: {roomType.max_adults} người lớn</span>
                        )}
                        {roomType?.max_children && (
                          <span>
                            {roomType?.max_adults ? ", " : "Tối đa: "}
                            {roomType.max_children} trẻ em
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200 hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="text-purple-600 text-xs font-semibold">
                        Tầng
                      </div>
                    </div>
                    <div className="text-xl font-bold text-purple-900">
                      {floor?.name ?? "—"}
                    </div>
                    <div className="text-xs text-purple-600 mt-0.5">
                      Vị trí phòng trong khách sạn
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {roomType?.amenities &&
                  Array.isArray(roomType.amenities) &&
                  roomType.amenities.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <h3 className="text-sm font-bold text-green-800">
                          Tiện ích phòng
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {roomType.amenities
                          .slice(0, 6)
                          .map((amenity: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-green-700"
                            >
                              <svg
                                className="w-3 h-3 text-green-500 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="truncate">{amenity}</span>
                            </div>
                          ))}
                      </div>
                      {roomType.amenities.length > 6 && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          + {roomType.amenities.length - 6} tiện ích khác
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Link to="/rooms" className="flex-1 min-w-[150px]">
                  <button className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">
                    ← Quay lại
                  </button>
                </Link>

                <button
                  onClick={() => {
                    if (status !== "available") {
                      message.warning("Phòng này hiện không khả dụng để đặt");
                      return;
                    }
                    // Kiểm tra đăng nhập
                    if (!auth?.token || !auth?.user) {
                      message.warning("Vui lòng đăng nhập để đặt phòng");
                      navigate("/signin", {
                        state: { from: `/rooms/${room.id}` },
                      });
                      return;
                    }
                    // Mở modal chọn ngày
                    setIsBookingModalOpen(true);
                  }}
                  className={`flex-1 min-w-[150px] w-full px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg ${
                    status === "available"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={status !== "available"}
                >
                  Đặt phòng ngay
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="mt-6 p-4 lg:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Mô tả chi tiết
            </h3>
            <div
              className="bg-white rounded-xl p-4 shadow-sm text-sm text-gray-700 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(desc) }}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 lg:p-6">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-blue-600"
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
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                Nhận phòng linh hoạt
              </h3>
              <p className="text-xs text-gray-600">
                Check-in từ 14:00, check-out trước 12:00. Hỗ trợ trả phòng muộn.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-green-600"
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
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                Hủy miễn phí
              </h3>
              <p className="text-xs text-gray-600">
                Hủy miễn phí trước 24h. Hoàn tiền 100% nếu hủy sớm.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-purple-600"
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
              <h3 className="font-bold text-gray-800 mb-1 text-sm">
                Hỗ trợ 24/7
              </h3>
              <p className="text-xs text-gray-600">
                Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ mọi lúc mọi nơi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <RoomBookingModal
        open={isBookingModalOpen}
        onCancel={() => setIsBookingModalOpen(false)}
        room={room || null}
        roomType={roomType || null}
      />
    </div>
  );
};

export default RoomDetail;
