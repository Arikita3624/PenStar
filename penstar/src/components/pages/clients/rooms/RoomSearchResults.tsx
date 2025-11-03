import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  message,
  Spin,
  Empty,
  Card,
  Button,
  Tag,
  Collapse,
  Row,
  Col,
  InputNumber,
  Select,
} from "antd";
import { searchAvailableRooms } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import type { Room, RoomSearchParams } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarOutlined,
  HomeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import BookingSidebar from "@/components/common/BookingSidebar";
import { CHILD_AGE_LIMIT } from "@/constants/bookingConstants";

const { Panel } = Collapse;

const RoomSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<RoomSearchParams | null>(
    location.state?.searchParams || null
  );

  // Filter state
  const [typeFilter, setTypeFilter] = useState<number | null>(null);

  // Fetch room types for filter
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  // State cho room selection mới theo Mường Thanh
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [numRooms, setNumRooms] = useState(1);
  const [roomsConfig, setRoomsConfig] = useState<
    Array<{
      num_adults: number;
      num_children: number;
    }>
  >([{ num_adults: 1, num_children: 0 }]);

  useEffect(() => {
    if (searchParams) {
      handleSearch(searchParams);
      // Set num_rooms từ search params
      if (searchParams.num_rooms) {
        setNumRooms(searchParams.num_rooms);
        setRoomsConfig(
          Array.from({ length: searchParams.num_rooms }, () => ({
            num_adults: 1,
            num_children: 0,
          }))
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (params: RoomSearchParams) => {
    setLoading(true);
    setSelectedRoom(null);
    try {
      console.log("🔍 Searching with params:", params);
      const response = await searchAvailableRooms(params);
      console.log("📦 Search response:", response);
      setRooms(response.data);
      setSearchParams(params);
      message.success(response.message);
    } catch (error) {
      console.error("Error searching rooms:", error);
      message.error("Lỗi tìm kiếm phòng");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestChange = (
    roomIndex: number,
    field: "num_adults" | "num_children",
    value: number | null
  ) => {
    if (!selectedRoom) return;

    const newConfig = [...roomsConfig];
    const currentConfig = { ...newConfig[roomIndex] };
    const newValue = value || 0;

    // Tính tổng sau khi thay đổi
    const otherField = field === "num_adults" ? "num_children" : "num_adults";
    const total = newValue + currentConfig[otherField];

    // Kiểm tra vượt capacity
    if (total > selectedRoom.capacity) {
      message.warning(
        `Tổng số khách không được vượt quá ${selectedRoom.capacity} người!`
      );
      return;
    }

    // Kiểm tra max_adults hoặc max_children
    if (
      field === "num_adults" &&
      selectedRoom.max_adults &&
      newValue > selectedRoom.max_adults
    ) {
      message.warning(`Số người lớn tối đa: ${selectedRoom.max_adults}`);
      return;
    }

    if (
      field === "num_children" &&
      selectedRoom.max_children &&
      newValue > selectedRoom.max_children
    ) {
      message.warning(`Số trẻ em tối đa: ${selectedRoom.max_children}`);
      return;
    }

    currentConfig[field] = newValue;
    newConfig[roomIndex] = currentConfig;
    setRoomsConfig(newConfig);
  };

  const validateCapacity = () => {
    if (!selectedRoom) return false;

    for (let i = 0; i < numRooms; i++) {
      const { num_adults, num_children } = roomsConfig[i];
      const total = num_adults + num_children;

      if (total > selectedRoom.capacity) {
        message.error(
          `Phòng ${i + 1}: Tổng số khách (${total}) vượt quá sức chứa (${
            selectedRoom.capacity
          })`
        );
        return false;
      }

      if (selectedRoom.max_adults && num_adults > selectedRoom.max_adults) {
        message.error(
          `Phòng ${i + 1}: Số người lớn (${num_adults}) vượt quá giới hạn (${
            selectedRoom.max_adults
          })`
        );
        return false;
      }

      if (
        selectedRoom.max_children &&
        num_children > selectedRoom.max_children
      ) {
        message.error(
          `Phòng ${i + 1}: Số trẻ em (${num_children}) vượt quá giới hạn (${
            selectedRoom.max_children
          })`
        );
        return false;
      }
    }

    return true;
  };

  const handleBooking = () => {
    if (!selectedRoom) {
      message.warning("Vui lòng chọn loại phòng");
      return;
    }

    if (!validateCapacity()) {
      return;
    }

    if (!searchParams) {
      message.error("Thiếu thông tin tìm kiếm. Vui lòng tìm kiếm lại!");
      return;
    }

    // ⚠️ Validation: Check số phòng đã chọn config phải = num_rooms từ search
    const selectedRoomsCount = roomsConfig.length;
    if (selectedRoomsCount !== numRooms) {
      message.error(
        `Bạn đã chọn đặt ${numRooms} phòng nhưng chỉ cấu hình ${selectedRoomsCount} phòng. Vui lòng điều chỉnh!`
      );
      return;
    }

    // Navigate to multi-room booking page với config
    navigate("/booking/multi-create", {
      state: {
        selectedRoomIds: Array(numRooms).fill(selectedRoom.id),
        searchParams,
        roomsConfig, // Truyền thông tin số khách cho từng phòng
        numRooms,
      },
    });
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  // Filter rooms by type
  const filteredRooms = typeFilter
    ? rooms.filter((room) => room.type_id === typeFilter)
    : rooms;

  const stripHtml = (html?: string) => {
    if (!html) return "";
    const tmp = html.replace(/<[^>]+>/g, "");
    return tmp.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => {
      const map: Record<string, string> = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
      };
      return map[m] || m;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "2rem 0",
        }}
      >
        <div className="container mx-auto px-4">
          <RoomSearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8">
        {searchParams && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center text-gray-700">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-purple-600" />
                  <span>
                    {searchParams.check_in} → {searchParams.check_out}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HomeOutlined className="text-purple-600" />
                  <span className="font-semibold">{numRooms} phòng</span>
                </div>
                {searchParams.promo_code && (
                  <Tag color="gold" className="font-semibold">
                    🎫 {searchParams.promo_code}
                  </Tag>
                )}
              </div>

              {/* Filter by Room Type */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Loại phòng:</span>
                <Select
                  placeholder="Tất cả"
                  allowClear
                  style={{ width: 200 }}
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value || null)}
                >
                  {Array.isArray(roomTypes) &&
                    roomTypes.map((type) => (
                      <Select.Option key={type.id} value={type.id}>
                        {type.name}
                      </Select.Option>
                    ))}
                </Select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Đang tìm kiếm phòng...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <Empty
            description={
              typeFilter
                ? "Không có phòng nào thuộc loại này"
                : "Không tìm thấy phòng trống"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {typeFilter ? (
              <Button type="default" onClick={() => setTypeFilter(null)}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button type="primary" onClick={() => navigate("/")}>
                Quay về trang chủ
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={24}>
            {/* Left Column: Room Cards */}
            <Col xs={24} lg={16}>
              <div className="space-y-6">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    hoverable
                    className={`shadow-md ${
                      selectedRoom?.id === room.id
                        ? "border-2 border-yellow-400"
                        : ""
                    }`}
                    style={{ borderRadius: "12px" }}
                  >
                    <Row gutter={16}>
                      {/* Room Image */}
                      <Col xs={24} md={8}>
                        <img
                          alt={room.name}
                          src={room.thumbnail}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </Col>

                      {/* Room Info */}
                      <Col xs={24} md={16}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {room.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Tag color="blue">
                                  🛏️ Sức chứa: {room.capacity} người
                                </Tag>
                                {room.max_adults && (
                                  <Tag color="cyan">
                                    👨 Người lớn: {room.max_adults}
                                  </Tag>
                                )}
                                {room.max_children && (
                                  <Tag color="orange">
                                    👶 Trẻ em: {room.max_children}
                                  </Tag>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-red-600">
                                {formatPrice(room.price)}
                              </div>
                              <div className="text-sm text-gray-500">/ đêm</div>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-2">
                            {stripHtml(room.short_desc)}
                          </p>

                          {/* Guest Selector Collapse */}
                          {selectedRoom?.id === room.id && (
                            <Collapse
                              defaultActiveKey={["0"]}
                              className="mt-4"
                              style={{ background: "#fafafa" }}
                            >
                              {Array.from({ length: numRooms }).map(
                                (_, index) => {
                                  const currentAdults =
                                    roomsConfig[index]?.num_adults || 1;
                                  const currentChildren =
                                    roomsConfig[index]?.num_children || 0;
                                  const remainingForChildren =
                                    room.capacity - currentAdults;
                                  const remainingForAdults =
                                    room.capacity - currentChildren;

                                  return (
                                    <Panel
                                      header={`Chọn số người phòng ${
                                        index + 1
                                      }`}
                                      key={index}
                                      className="font-semibold"
                                    >
                                      <Row gutter={16}>
                                        <Col span={12}>
                                          <div className="mb-2 text-gray-700">
                                            👨 Người lớn (≥{CHILD_AGE_LIMIT}{" "}
                                            tuổi)
                                          </div>
                                          <InputNumber
                                            min={1}
                                            max={Math.min(
                                              room.max_adults || room.capacity,
                                              remainingForAdults
                                            )}
                                            value={currentAdults}
                                            onChange={(value) =>
                                              handleGuestChange(
                                                index,
                                                "num_adults",
                                                value
                                              )
                                            }
                                            className="w-full"
                                            size="large"
                                          />
                                        </Col>
                                        <Col span={12}>
                                          <div className="mb-2 text-gray-700">
                                            👶 Trẻ em (&lt;{CHILD_AGE_LIMIT}{" "}
                                            tuổi)
                                          </div>
                                          <InputNumber
                                            min={0}
                                            max={Math.min(
                                              room.max_children ||
                                                room.capacity,
                                              remainingForChildren
                                            )}
                                            value={currentChildren}
                                            onChange={(value) =>
                                              handleGuestChange(
                                                index,
                                                "num_children",
                                                value
                                              )
                                            }
                                            className="w-full"
                                            size="large"
                                          />
                                        </Col>
                                      </Row>
                                    </Panel>
                                  );
                                }
                              )}
                            </Collapse>
                          )}

                          <div className="flex gap-3 mt-4">
                            <Button
                              type={
                                selectedRoom?.id === room.id
                                  ? "primary"
                                  : "default"
                              }
                              size="large"
                              icon={
                                selectedRoom?.id === room.id ? (
                                  <CheckCircleOutlined />
                                ) : null
                              }
                              onClick={() => {
                                if (selectedRoom?.id === room.id) {
                                  setSelectedRoom(null);
                                } else {
                                  setSelectedRoom(room);
                                }
                              }}
                              style={
                                selectedRoom?.id === room.id
                                  ? {
                                      background: "#10b981",
                                      borderColor: "#10b981",
                                    }
                                  : {}
                              }
                            >
                              {selectedRoom?.id === room.id
                                ? "Đã chọn"
                                : "Chọn phòng"}
                            </Button>
                            <Link to={`/rooms/${room.id}`}>
                              <Button size="large">Xem chi tiết →</Button>
                            </Link>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </Col>

            {/* Right Column: Booking Sidebar */}
            <Col xs={24} lg={8}>
              {searchParams && (
                <BookingSidebar
                  checkIn={searchParams.check_in}
                  checkOut={searchParams.check_out}
                  rooms={
                    selectedRoom
                      ? roomsConfig.map((config, index) => ({
                          id: selectedRoom.id,
                          name: selectedRoom.name,
                          type_name: `Phòng ${index + 1}`,
                          price: selectedRoom.price,
                          num_adults: config.num_adults,
                          num_children: config.num_children,
                        }))
                      : []
                  }
                  promoCode={searchParams.promo_code}
                  onCheckout={handleBooking}
                  loading={loading}
                />
              )}
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};

export default RoomSearchResults;
