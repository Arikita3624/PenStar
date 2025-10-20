import { Button, Card, Col, Row, Spin, Input } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "@/services/roomsApi";
import type { Room } from "@/types/room";

// HomePage: trang chủ cho một khách sạn cụ thể, chủ đạo trắng-xanh
const HomePage = () => {
  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const featured = (rooms || []).slice(0, 12); // take more so slices available
  const [pageIdx, setPageIdx] = useState(0);
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(featured.length / perPage));
  const currentSlice = featured.slice(
    pageIdx * perPage,
    pageIdx * perPage + perPage
  );

  const getRoomImage = (r: Room | Record<string, unknown>) => {
    const obj = r as Record<string, unknown>;
    // backend uses `thumbnail`, db uses `thumbnail`; older frontend uses `image`
    const img = obj.thumbnail ?? obj.image ?? obj.image_url ?? "";
    return String(img || "/room-default.jpg");
  };

  const getRoomTitle = (r: Room | Record<string, unknown>) => {
    const obj = r as Record<string, unknown>;
    // backend stores `name`, frontend type uses `number` as room label
    const title = obj.name ?? obj.number ?? obj.title;
    return String(title ?? `Phòng ${obj.id ?? ""}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero */}
      <section className="relative">
        <div className="h-96 hero-bg relative">
          <div className="absolute inset-0 bg-black/55" />
          <div className="container mx-auto px-4 h-full">
            <div className="h-full flex items-center">
              <div className="text-white z-10 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                  Khách sạn PenStar
                </h1>
                <p className="mb-6 text-lg">
                  Trải nghiệm sự thoải mái và dịch vụ tận tâm tại Khách sạn
                  Hoàng Gia — nơi nghỉ dưỡng cổ kính kết hợp tiện nghi hiện đại.
                </p>
                <div className="flex gap-3">
                  <Link to="/booking">
                    <button className="bg-[#0a4f86] text-white rounded-md px-4 py-2 hover:bg-[#083a60]">
                      Đặt phòng ngay
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* floating search bar */}
        <div className="container mx-auto px-4">
          <div className="-mt-10 relative z-20">
            <div className="bg-white rounded-lg shadow-lg p-4 flex gap-3 items-center">
              <Input.Search
                placeholder="Bạn muốn đến đâu?"
                style={{ width: 360 }}
              />
              <div className="border-l h-8" />
              <div className="flex gap-2">
                <Button>Ngày nhận phòng</Button>
                <Button>Ngày trả phòng</Button>
              </div>
              <div className="ml-auto">
                <Button type="primary">Tìm</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center ps-card">
              <h3 className="text-xl font-semibold text-[#0a66a3]">
                Vị trí trung tâm
              </h3>
              <p className="text-gray-600 mt-2">
                Gần các điểm tham quan và giao thông
              </p>
            </Card>
            <Card className="text-center ps-card">
              <h3 className="text-xl font-semibold text-[#0a66a3]">
                Dịch vụ 24/7
              </h3>
              <p className="text-gray-600 mt-2">
                Nhân viên thân thiện, hỗ trợ mọi lúc
              </p>
            </Card>
            <Card className="text-center ps-card">
              <h3 className="text-xl font-semibold text-[#0a66a3]">
                Tiện nghi đầy đủ
              </h3>
              <p className="text-gray-600 mt-2">WiFi, ăn sáng, dịch vụ phòng</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured rooms */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold ps-section-title">
              Phòng nổi bật
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
                disabled={pageIdx === 0}
              />
              <div className="text-sm text-gray-600">
                {pageIdx + 1} / {totalPages}
              </div>
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={() =>
                  setPageIdx((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={pageIdx >= totalPages - 1}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Spin />
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {currentSlice.map((r) => (
                <Col xs={24} sm={12} md={8} key={r.id}>
                  <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 group relative">
                    <img
                      src={getRoomImage(r)}
                      alt={getRoomTitle(r)}
                      className="h-64 w-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="text-lg font-bold mb-1">
                        {getRoomTitle(r)}
                      </h3>
                      <p className="text-sm opacity-90 mb-2 truncate">
                        {r.description
                          ? String(r.description).replace(/<[^>]*>/g, "")
                          : ""}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-yellow-300">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(Number(r.price || 0))}
                        </span>
                        <Link to={`/rooms/${r.id}`}>
                          <Button
                            type="primary"
                            size="small"
                            className="bg-[#0a66a3] border-none hover:bg-[#084f7a]"
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* News / Promotions */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#0a66a3] mb-6">
            Tin tức & Ưu đãi
          </h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card hoverable>
                <h3 className="font-semibold">Ưu đãi cuối tuần</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Giảm 20% cho đặt phòng 2 đêm trở lên.
                </p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable>
                <h3 className="font-semibold">Sự kiện tại khách sạn</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Tiệc tối chủ đề và nhạc sống mỗi thứ 7.
                </p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card hoverable>
                <h3 className="font-semibold">Gói nghỉ dưỡng</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Bao gồm spa và bữa sáng cho 2 người.
                </p>
              </Card>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
