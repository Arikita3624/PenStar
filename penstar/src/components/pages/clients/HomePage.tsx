import type { RoomSearchParams } from "@/types/room";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import { useState } from "react";

// Import images from assets
import heroImage from "@/assets/images/heroImage.png";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const destinations = [
    [
      {
        name: "TP HỒ CHÍ MINH",
        image:
          "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600",
        span: "single",
      },
      {
        name: "ĐÀ NẴNG",
        images: [
          "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600",
          "https://images.unsplash.com/photo-1548013146-72479768bada?w=600",
        ],
        span: "double",
      },
      {
        name: "LÀO CAI",
        image:
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600",
        span: "single",
      },
      {
        name: "KHÁNH HÒA",
        image:
          "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600",
        span: "single",
      },
      {
        name: "QUẢNG NINH",
        images: [
          "https://images.unsplash.com/photo-1528127269322-539801943592?w=600",
          "https://images.unsplash.com/photo-1598880940371-c756e015faf1?w=600",
        ],
        span: "double",
      },
    ],
    [
      {
        name: "HÀ NỘI",
        image:
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600",
        span: "single",
      },
      {
        name: "NGHỆ AN",
        image:
          "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600",
        span: "single",
      },
      {
        name: "PHÚ QUỐC",
        image:
          "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600",
        span: "single",
      },
      {
        name: "NHA TRANG",
        image:
          "https://images.unsplash.com/photo-1568084680786-a84340b5e60d?w=600",
        span: "single",
      },
      {
        name: "HUẾ",
        image:
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
        span: "single",
      },
    ],
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % destinations.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + destinations.length) % destinations.length
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image - Mường Thanh Style */}
      <section
        className="relative min-h-[650px] flex items-center overflow-visible pb-28"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(10,79,134,0.5) 0%, rgba(13,110,171,0.3) 50%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
          <div className="max-w-3xl mb-16">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
              style={{ textShadow: "2px 4px 8px rgba(0,0,0,0.5)" }}
            >
              Đặt phòng cùng
              <br />
              PenStar
            </h1>
            <p
              className="text-lg md:text-xl text-white leading-relaxed max-w-2xl"
              style={{ textShadow: "1px 2px 4px rgba(0,0,0,0.5)" }}
            >
              Với nguồn lực dồi dào, kinh nghiệm và uy tín trong lĩnh vực dịch
              vụ, Lữ hành PenStar luôn mang đến cho khách hàng những dịch vụ
              khách sạn giá trị nhất.
            </p>
          </div>
        </div>

        {/* Search Bar - Floating at bottom */}
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-1/2 z-20">
          <div className="max-w-6xl mx-auto px-4">
            <RoomSearchBar
              onSearch={(params: RoomSearchParams) => {
                // Đảm bảo không truyền num_rooms vào searchParams
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { num_rooms, ...rest } = params as RoomSearchParams & {
                  num_rooms?: number;
                };
                navigate("/rooms/search-results", {
                  state: { searchParams: rest },
                });
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section - Below Hero like Mường Thanh */}
      <section className="py-12 mt-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group text-center">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-gray-600 group-hover:text-blue-500"
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
              <h3 className="text-sm font-semibold text-gray-700 leading-tight">
                Đảm bảo giá tốt nhất
              </h3>
            </div>

            {/* Feature 2 */}
            <div className="group text-center">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-gray-600 group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 leading-tight">
                Nhiều điểm đến lựa chọn
              </h3>
            </div>

            {/* Feature 3 */}
            <div className="group text-center">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-gray-600 group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 leading-tight">
                Đảm bảo chất lượng phục vụ
              </h3>
            </div>

            {/* Feature 4 */}
            <div className="group text-center">
              <div className="w-20 h-20 border-2 border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:border-blue-500 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-gray-600 group-hover:text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 leading-tight">
                Hỗ trợ khách hàng nhanh chóng
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Ưu Đãi Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-gray-400">ƯU ĐÃI</span>{" "}
              <span className="text-gray-800">DÀNH CHO BẠN</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: "HẾT PHÒNG",
                tagColor: "bg-yellow-500",
                image:
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600",
                title:
                  "HỆ NGHỈ NGHỈ PENSTAR 2N1Đ + Ăn sáng 2N + Tour Khu Di tích",
                price: "1.000.000 VNĐ",
                duration: "2 ngày 1 đêm",
              },
              {
                tag: "ƯU ĐÃI",
                tagColor: "bg-yellow-500",
                image:
                  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600",
                title:
                  "KHÁM PHÁ DU LỊCH - 1 ĐÊM Khách sạn PENSTAR + Ăn sáng buffet",
                price: "1.500.000 VNĐ",
                duration: "2 ngày 1 đêm",
              },
              {
                tag: "ƯU ĐÃI",
                tagColor: "bg-yellow-500",
                image:
                  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600",
                title: "COMBO NGHỈ DƯỠNG - Khách sạn PENSTAR + Ăn sáng buffet",
                price: "1.500.000 VNĐ",
                duration: "2 ngày 1 đêm",
              },
            ].map((deal, idx) => (
              <div
                key={idx}
                className="bg-white overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200"
              >
                <div className="relative">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-48 object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 ${deal.tagColor} text-white px-3 py-1 text-xs font-bold`}
                  >
                    {deal.tag}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[40px]">
                    {deal.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-red-600">
                      {deal.price}
                    </span>
                    <span className="text-xs text-gray-500">
                      {deal.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="px-6 py-2 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition font-medium">
              Xem nhiều →
            </button>
          </div>
        </div>
      </section>

      {/* Combo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-gray-400">COMBO</span>{" "}
              <span className="text-gray-800">GIÁ TỐT</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                discount: "-30%",
                image:
                  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600",
                title:
                  "Combo nghỉ dưỡng 3N2Đ - Ẩm thực + Dịch vụ spa + Tour tham quan",
                price: "1.850.000 VNĐ",
              },
              {
                discount: "-30%",
                image:
                  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600",
                title:
                  "Combo nghỉ dưỡng 3N2Đ - Ẩm thực + Dịch vụ spa + Tour tham quan",
                price: "1.850.000 VNĐ",
              },
              {
                discount: "-30%",
                image:
                  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600",
                title:
                  "Combo nghỉ dưỡng 3N2Đ - Ẩm thực + Dịch vụ spa + Tour tham quan",
                price: "1.850.000 VNĐ",
              },
            ].map((combo, idx) => (
              <div
                key={idx}
                className="bg-white overflow-hidden shadow-md hover:shadow-xl transition-all"
              >
                <div className="relative">
                  <img
                    src={combo.image}
                    alt={combo.title}
                    className="w-full h-48 object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 text-sm font-bold">
                    {combo.discount}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[40px]">
                    {combo.title}
                  </h3>
                  <div className="mb-2">
                    <span className="text-lg font-bold text-orange-500">
                      {combo.price}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>10000 người quan tâm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="px-6 py-2 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition font-medium">
              Xem nhiều →
            </button>
          </div>
        </div>
      </section>

      {/* Điểm Đến Section - Carousel Style */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-gray-400">ĐIỂM ĐẾN</span>{" "}
              <span className="text-gray-800">NỔI BẬT</span>
            </h2>
          </div>

          <div className="relative">
            {/* Previous Button */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 shadow-lg transition-all"
              aria-label="Previous"
            >
              <svg
                className="w-6 h-6 text-gray-800"
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

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 shadow-lg transition-all"
              aria-label="Next"
            >
              <svg
                className="w-6 h-6 text-gray-800"
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

            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {destinations.map((slide, slideIdx) => (
                  <div key={slideIdx} className="w-full flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {slide.map((dest, idx) => (
                        <div
                          key={idx}
                          className={
                            dest.span === "double"
                              ? "md:col-span-1"
                              : "md:col-span-1"
                          }
                        >
                          {dest.images ? (
                            // Split layout for locations with 2 images
                            <div className="grid grid-rows-2 gap-4 h-64">
                              <div className="relative group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-all">
                                <img
                                  src={dest.images[0]}
                                  alt={dest.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                  <div className="p-3 w-full">
                                    <div className="flex items-center text-white">
                                      <svg
                                        className="w-3 h-3 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                      </svg>
                                      <h3 className="text-xs font-bold">
                                        {dest.name}
                                      </h3>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="relative group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-all">
                                <img
                                  src={dest.images[1]}
                                  alt={dest.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ) : (
                            // Single image layout
                            <div className="relative group cursor-pointer overflow-hidden shadow-md hover:shadow-xl transition-all h-64">
                              <img
                                src={dest.image}
                                alt={dest.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                                <div className="p-4 w-full">
                                  <div className="flex items-center text-white">
                                    <svg
                                      className="w-4 h-4 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    <h3 className="text-sm font-bold">
                                      {dest.name}
                                    </h3>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel dots */}
            <div className="flex justify-center mt-6 gap-2">
              {destinations.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === idx ? "bg-yellow-500" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                ></button>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <button className="px-6 py-2 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition font-medium">
              Xem nhiều →
            </button>
          </div>
        </div>
      </section>

      {/* Tin Tức Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">
              <span className="text-gray-400">TIN TỨC</span>{" "}
              <span className="text-gray-800">NỔI BẬT</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Large Featured Article */}
            <div className="md:row-span-2 bg-white overflow-hidden shadow-md hover:shadow-xl transition-all">
              <img
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=700"
                alt="Khám phá Sapa"
                className="w-full h-80 object-cover"
              />
              <div className="p-6">
                <span className="inline-block bg-blue-600 text-white px-3 py-1 text-xs font-semibold mb-3">
                  KHU DU LỊCH
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-blue-600 cursor-pointer">
                  KHÁM PHÁ DU LỊCH SAPA: CÁNH ĐỒNG CHÈ - CUNG ĐƯỜNG TUYỆT ĐẸP
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Nằm ở độ cao hơn 1.500m so với mặt nước biển, Sapa luôn là
                  điểm đến hấp dẫn với khí hậu mát mẻ quanh năm, cảnh quan thiên
                  nhiên hùng vĩ và văn hóa đặc sắc của các dân tộc thiểu số...
                </p>
                <button className="mt-4 text-yellow-600 font-medium hover:text-yellow-700">
                  Đọc tiếp →
                </button>
              </div>
            </div>

            {/* Small Articles */}
            {[
              {
                image:
                  "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=400",
                title:
                  "Những lễ hội ở Bắc Bộ Việt Nam - Góp phần tạo cuộc hội du lịch",
                category: "LỄ HỘI",
              },
              {
                image:
                  "https://images.unsplash.com/photo-1548013146-72479768bada?w=400",
                title:
                  "Review địa điểm du lịch Sapa từ A đến Z: Nơi bạn nên ghé thăm!",
                category: "Q&A",
              },
            ].map((article, idx) => (
              <div
                key={idx}
                className="bg-white overflow-hidden shadow-md hover:shadow-xl transition-all flex"
              >
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-40 h-full object-cover"
                />
                <div className="p-4 flex-1">
                  <span className="inline-block bg-blue-600 text-white px-2 py-1 text-xs font-semibold mb-2">
                    {article.category}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-800 hover:text-blue-600 cursor-pointer line-clamp-3">
                    {article.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button className="px-6 py-2 border border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition font-medium">
              Xem nhiều →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
