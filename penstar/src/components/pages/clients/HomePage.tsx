import type { RoomSearchParams } from "@/types/room";
import RoomSearchBar from "@/components/common/RoomSearchBar";

// Import images from assets
import heroImage from "@/assets/images/heroImage.png";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image - Mường Thanh Style */}
      <section
        className="relative min-h-[600px] flex items-center overflow-visible pb-24"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Subtle dark overlay - much lighter */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 w-full">
          <div className="max-w-2xl mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              Đặt phòng cùng PenStar
            </h1>
            <p className="text-xl text-white mb-8 leading-relaxed drop-shadow-lg">
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
                const { num_rooms, ...rest } = params as any;
                navigate("/rooms/search-results", {
                  state: { searchParams: rest },
                });
              }}
            />
          </div>
        </div>
      </section>

      {/* About Section with Stats */}
      <section className="py-24 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* News Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
