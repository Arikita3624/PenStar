import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "@/services/roomsApi";
import type { Room } from "@/types/room";
import { useState, useEffect, useRef } from "react";

// Import images from assets
import bannerImage from "@/assets/images/banner.png";
import heroImage from "@/assets/images/heroImage.png";

const HomePage = () => {
  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const featured = (rooms || []).slice(0, 6);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(4);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Responsive slides
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setSlidesToShow(1);
      } else if (window.innerWidth < 1024) {
        setSlidesToShow(2);
      } else if (window.innerWidth < 1280) {
        setSlidesToShow(3);
      } else {
        setSlidesToShow(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = Math.max(0, featured.length - slidesToShow);
      return prev >= maxSlide ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = Math.max(0, featured.length - slidesToShow);
      return prev <= 0 ? maxSlide : prev - 1;
    });
  };

  // Auto play
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const maxSlide = Math.max(0, featured.length - slidesToShow);
        return prev >= maxSlide ? 0 : prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [featured.length, slidesToShow]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getRoomImage = (r: Room | Record<string, unknown>) => {
    const obj = r as Record<string, unknown>;
    const img = obj.thumbnail ?? obj.image ?? obj.image_url ?? "";
    return String(img || "/room-default.jpg");
  };

  const getRoomTitle = (r: Room | Record<string, unknown>) => {
    const obj = r as Record<string, unknown>;
    const title = obj.name ?? obj.number ?? obj.title;
    return String(title ?? `Phòng ${obj.id ?? ""}`);
  };

  const stripHtml = (html?: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Gradient Blue Background */}
      <section className="relative bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 min-h-[600px] flex items-center overflow-hidden">
        {/* Decorative Banner Image */}
        <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-end">
          <img
            src={bannerImage}
            alt="PenStar Travel"
            className="h-full w-auto object-contain opacity-90"
          />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Đặt phòng cùng PenStar
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Với nguồn lực dồi dào, kinh nghiệm và uy tín trong lĩnh vực dịch
              vụ, Lữ hành PenStar luôn mang đến cho khách hàng những dịch vụ
              khách sạn giá trị nhất.
            </p>
            <Link to="/rooms">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition shadow-lg">
                Tìm hiểu ngay
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section with Stats */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <h3 className="text-blue-600 text-lg font-semibold mb-3 uppercase tracking-wide">
                Về chúng tôi
              </h3>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">PenStar</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Chúng tôi luôn lắng nghe và chia sẻ mong muốn của từng Quý khách
                hàng, mang lại sự hài lòng về dịch vụ và thái độ phục vụ của
                từng nhân viên. Mỗi dịch vụ là một mắt xích kết nối hoàn hảo cho
                chuyến đi của Quý khách. Hạnh phúc và sự hài lòng của khách hàng
                chính là giá trị cốt lõi của chúng tôi.
              </p>
            </div>

            {/* Right: Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img
                    src={heroImage}
                    alt="PenStar Resort"
                    className="rounded-2xl shadow-lg w-full h-64 object-cover transform rotate-3"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"
                    alt="Hotel Room"
                    className="rounded-2xl shadow-lg w-full h-48 object-cover transform -rotate-2"
                  />
                </div>
                <div className="pt-12">
                  <img
                    src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400"
                    alt="Hotel Lobby"
                    className="rounded-2xl shadow-lg w-full h-80 object-cover transform -rotate-3"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-xl transition">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Các Thông Tin Tour Mới Nhất
              </h3>
              <p className="text-gray-600">
                Luôn cập nhật các thông tin mới nhất, đầy đủ nhất về các tour
                tốt nhất hiện nay.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-xl transition">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
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
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Chuyên Gia Tư Vấn Chi Tiết Nhất
              </h3>
              <p className="text-gray-600">
                Các tư vấn viên chuyên nghiệp luôn sẵn sàng hỗ trợ bạn tận tâm
                và chi tiết nhất.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-xl transition">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
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
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Khuyến Mãi & Giá Luôn Tốt Nhất
              </h3>
              <p className="text-gray-600">
                Các chương trình khuyến mãi hấp dẫn và giá tour cạnh tranh được
                cập nhật liên tục.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-600 mb-3">
              Phòng Nghỉ Nổi Bật
            </h2>
            <p className="text-gray-600 text-lg">
              Khám phá những khách sạn chất lượng cao với dịch vụ tuyệt vời và
              vị trí thuận lợi
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="relative px-8 pb-8">
              {/* Slider Container */}
              <div className="overflow-hidden" ref={sliderRef}>
                <div
                  className="flex transition-transform duration-700 ease-in-out gap-6"
                  style={
                    {
                      transform: `translateX(-${
                        currentSlide * (100 / slidesToShow)
                      }%)`,
                    } as React.CSSProperties
                  }
                >
                  {featured.map((room) => {
                    return (
                      <div
                        key={room.id}
                        className="flex-shrink-0"
                        style={
                          {
                            width: `calc(${100 / slidesToShow}% - ${
                              (24 * (slidesToShow - 1)) / slidesToShow
                            }px)`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
                          <div className="relative h-56 overflow-hidden">
                            <img
                              src={getRoomImage(room)}
                              alt={getRoomTitle(room)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3">
                              <div className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                5
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="font-bold text-gray-800 mb-2 text-lg line-clamp-1">
                              {getRoomTitle(room)}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                              {stripHtml(room.short_desc) ||
                                "Phòng sang trọng với đầy đủ tiện nghi hiện đại"}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                WiFi miễn phí
                              </span>
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                Bể bơi
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-4 pt-4 border-t mt-2 pb-8">
                              <div className="min-w-0">
                                <p className="text-2xl font-bold text-blue-600 truncate">
                                  {new Intl.NumberFormat("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                  }).format(Number(room.price || 0))}
                                </p>
                                <p className="text-xs text-gray-500">/ đêm</p>
                              </div>
                              <Link to={`/rooms/${room.id}`}>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold text-sm transition flex-shrink-0 whitespace-nowrap md:px-4 md:py-2">
                                  Xem chi tiết
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <button
                onClick={prevSlide}
                title="Phòng trước"
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-800 hover:text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition z-10"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                title="Phòng tiếp theo"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-blue-600 text-gray-800 hover:text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition z-10"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Dots Indicator */}
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({
                  length: Math.max(1, featured.length - slidesToShow + 1),
                }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index
                        ? "bg-blue-600 w-6"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    title={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/rooms">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition inline-flex items-center gap-2">
                Xem tất cả phòng
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-blue-600 mb-3">
              Tin tức mới nhất
            </h2>
            <p className="text-gray-600">
              Tour du lịch <span className="font-semibold">Trong nước</span> với{" "}
              <span className="font-semibold">PenStar</span>. Hành hương đầu
              xuân - Tận hưởng bán sắc Việt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image:
                  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600",
                title: "Cam Ranh – Thiên đường biển đảo của miền Trung",
                date: "9/4/2025",
                author: "Lê Trần Toàn",
                desc: "Nằm ở tỉnh Khánh Hòa, cách thành phố Nha Trang khoảng 60km, Cam Ranh đang trở thành điểm đến hấp dẫn...",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600",
                title: "Khám phá Tam Đảo: Thị trấn trong sương mơ huyền ảo",
                date: "9/4/2025",
                author: "Nguyễn Minh Tuấn",
                desc: "Chỉ cách Hà Nội khoảng 80km, Tam Đảo từ lâu đã trở thành điểm đến lý tưởng cho những ai muốn tìm một...",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
                title:
                  "Chùa Hương – Về miền đất Phật giữa chốn bồng lai tiên cảnh",
                date: "9/4/2025",
                author: "Phạm Thu Toàn",
                desc: "Nằm ở huyện Mỹ Đức, Hà Nội, quần thể Chùa Hương từ lâu đã trở thành điểm đến tâm linh và du lịch nổi...",
              },
            ].map((article, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-56 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-bold text-blue-600 mb-3 hover:text-blue-700 cursor-pointer">
                    {article.title}
                  </h3>
                  <div className="text-sm text-gray-500 mb-3">
                    {article.date} | {article.author}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
