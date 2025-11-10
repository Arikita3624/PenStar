import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin, Empty, Button, Tag, Row, Col, Select } from "antd";
import { searchAvailableRooms } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import type { Room, RoomSearchParams } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
import type { Floors } from "@/types/floors";
import type { RoomBookingConfig } from "@/types/roomBooking";
import { useQuery } from "@tanstack/react-query";
import { CalendarOutlined } from "@ant-design/icons";
import RoomSearchBar from "@/components/common/RoomSearchBar";
import BookingSidebar from "@/components/common/BookingSidebar";
import RoomTypeCard from "./RoomTypeCard";

const RoomSearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<RoomSearchParams | null>(
    location.state?.searchParams || null
  );

  // Filter state
  const [floorFilter, setFloorFilter] = useState<number | null>(null);

  // Fetch room types and floors
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  const { data: floors = [] } = useQuery<Floors[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  // State cho multi-room selection
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [numRooms, setNumRooms] = useState(1);
  const [roomsConfig, setRoomsConfig] = useState<RoomBookingConfig[]>([]);

  useEffect(() => {
    if (searchParams) {
      handleSearch(searchParams);
      // Set num_rooms từ search params
      if (searchParams.num_rooms) {
        setNumRooms(searchParams.num_rooms);
      }
    }

    // Xử lý auto-selected rooms từ catalog (nếu có)
    if (
      location.state?.autoSelectedRoomIds &&
      location.state?.autoSelectedConfigs
    ) {
      setSelectedRoomIds(location.state.autoSelectedRoomIds);
      setRoomsConfig(location.state.autoSelectedConfigs);
      message.success(
        `Đã tự động chọn ${location.state.autoSelectedRoomIds.length} phòng từ catalog`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (params: RoomSearchParams) => {
    setLoading(true);
    setSelectedRoomIds([]);
    setRoomsConfig([]);
    try {
      console.log("🔍 Searching with params:", params);
      const response = await searchAvailableRooms(params);
      console.log("📦 Search response:", response);
      setRooms(response.data);
      setSearchParams(params);
      // Cập nhật số phòng từ search params
      if (params.num_rooms) {
        setNumRooms(params.num_rooms);
      }
      message.success(response.message);
    } catch (error) {
      console.error("Error searching rooms:", error);
      message.error("Lỗi tìm kiếm phòng");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm chọn phòng theo loại (khi nhấn nút "Chọn phòng" trên card loại phòng)
  const handleSelectRoomType = useCallback(
    (roomsInType: Room[]) => {
      // Kiểm tra đã chọn phòng chưa
      if (selectedRoomIds.length > 0) {
        message.warning(
          "Vui lòng bỏ chọn các phòng đã chọn trước khi chọn loại phòng khác"
        );
        return;
      }

      // Lọc phòng trống
      const availableRooms = roomsInType.filter(
        (room) => room.status === "available"
      );

      if (availableRooms.length === 0) {
        message.warning("Không có phòng trống của loại này");
        return;
      }

      // Kiểm tra số lượng phòng trống có đủ không
      if (availableRooms.length < numRooms) {
        message.warning(
          `Loại phòng này chỉ còn ${availableRooms.length} phòng trống, không đủ ${numRooms} phòng`
        );
        return;
      }

      // Sắp xếp theo tầng và số phòng tăng dần
      const sortedRooms = [...availableRooms].sort((a, b) => {
        // Ưu tiên tầng (floor_id)
        if (a.floor_id !== b.floor_id) {
          return a.floor_id - b.floor_id;
        }
        // Sau đó sắp xếp theo số phòng (ví dụ: P301 -> 301)
        const numA = parseInt(a.name.replace(/[^\d]/g, "")) || 0;
        const numB = parseInt(b.name.replace(/[^\d]/g, "")) || 0;
        return numA - numB;
      });

      // Chọn số lượng phòng cần thiết
      const roomsToSelect = sortedRooms.slice(0, numRooms);

      // Cập nhật state
      const newSelectedIds = roomsToSelect.map((r) => r.id);
      const newConfigs = roomsToSelect.map((room) => ({
        room_id: room.id,
        num_adults: 1,
        num_children: 0,
      }));

      setSelectedRoomIds(newSelectedIds);
      setRoomsConfig(newConfigs);

      message.success(
        `Đã tự động chọn ${roomsToSelect.length} phòng: ${roomsToSelect
          .map((r) => r.name)
          .join(", ")}`
      );
    },
    [numRooms, selectedRoomIds.length]
  );

  // Toggle room selection
  const handleRoomSelect = useCallback(
    (room: Room) => {
      const isSelected = selectedRoomIds.includes(room.id);

      if (isSelected) {
        // Bỏ chọn phòng
        setSelectedRoomIds(selectedRoomIds.filter((id) => id !== room.id));
        setRoomsConfig(
          roomsConfig.filter((config) => config.room_id !== room.id)
        );
      } else {
        // Kiểm tra đã chọn đủ số phòng chưa
        if (selectedRoomIds.length >= numRooms) {
          message.warning(`Bạn chỉ được chọn tối đa ${numRooms} phòng!`);
          return;
        }

        // Thêm phòng mới
        setSelectedRoomIds([...selectedRoomIds, room.id]);
        setRoomsConfig([
          ...roomsConfig,
          {
            room_id: room.id,
            num_adults: 1,
            num_children: 0,
          },
        ]);
      }
    },
    [numRooms, roomsConfig, selectedRoomIds]
  );

  const handleGuestChange = useCallback(
    (
      roomId: number,
      field: "num_adults" | "num_children",
      value: number | null
    ) => {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) return;

      const configIndex = roomsConfig.findIndex((c) => c.room_id === roomId);
      if (configIndex === -1) return;

      const newConfig = [...roomsConfig];
      const currentConfig = { ...newConfig[configIndex] };
      const newValue = value || 0;

      // Tính tổng sau khi thay đổi
      const otherField = field === "num_adults" ? "num_children" : "num_adults";
      const total = newValue + currentConfig[otherField];

      // Kiểm tra vượt capacity
      if (total > room.capacity) {
        message.warning(
          `Tổng số khách không được vượt quá ${room.capacity} người!`
        );
        return;
      }

      // Kiểm tra max_adults hoặc max_children
      if (
        field === "num_adults" &&
        room.max_adults &&
        newValue > room.max_adults
      ) {
        message.warning(`Số người lớn tối đa: ${room.max_adults}`);
        return;
      }

      if (
        field === "num_children" &&
        room.max_children &&
        newValue > room.max_children
      ) {
        message.warning(`Số trẻ em tối đa: ${room.max_children}`);
        return;
      }

      currentConfig[field] = newValue;
      newConfig[configIndex] = currentConfig;
      setRoomsConfig(newConfig);
    },
    [rooms, roomsConfig]
  );

  const validateCapacity = () => {
    for (let i = 0; i < roomsConfig.length; i++) {
      const config = roomsConfig[i];
      const room = rooms.find((r) => r.id === config.room_id);
      if (!room) continue;

      const { num_adults, num_children } = config;
      const total = num_adults + num_children;

      if (total > room.capacity) {
        message.error(
          `Phòng "${room.name}": Tổng số khách (${total}) vượt quá sức chứa (${room.capacity})`
        );
        return false;
      }

      if (room.max_adults && num_adults > room.max_adults) {
        message.error(
          `Phòng "${room.name}": Số người lớn (${num_adults}) vượt quá giới hạn (${room.max_adults})`
        );
        return false;
      }

      if (room.max_children && num_children > room.max_children) {
        message.error(
          `Phòng "${room.name}": Số trẻ em (${num_children}) vượt quá giới hạn (${room.max_children})`
        );
        return false;
      }
    }

    return true;
  };

  const handleBooking = () => {
    if (selectedRoomIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    if (selectedRoomIds.length !== numRooms) {
      message.warning(`Vui lòng chọn đúng ${numRooms} phòng`);
      return;
    }

    if (!validateCapacity()) {
      return;
    }

    if (!searchParams) {
      message.error("Thiếu thông tin tìm kiếm. Vui lòng tìm kiếm lại!");
      return;
    }

    // Convert roomsConfig to format expected by MultiRoomBookingCreate
    const roomsConfigForBooking = roomsConfig.map((config) => ({
      num_adults: config.num_adults,
      num_children: config.num_children,
    }));

    // Navigate to multi-room booking page
    navigate("/booking/multi-create", {
      state: {
        selectedRoomIds,
        searchParams,
        roomsConfig: roomsConfigForBooking,
        numRooms,
      },
    });
  };

  // Filter rooms by floor
  const filteredRooms = useMemo(
    () =>
      floorFilter
        ? rooms.filter((room) => room.floor_id === floorFilter)
        : rooms,
    [floorFilter, rooms]
  );

  // Group rooms by room type
  const roomsByType = useMemo(
    () =>
      filteredRooms.reduce((acc, room) => {
        if (!acc[room.type_id]) {
          acc[room.type_id] = [];
        }
        acc[room.type_id].push(room);
        return acc;
      }, {} as Record<number, Room[]>),
    [filteredRooms]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar Section */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0a4f86 0%, #0d6eab 50%, #115e9c 100%)",
          padding: "2rem 0 3rem 0",
          boxShadow: "0 4px 20px rgba(10, 79, 134, 0.3)",
        }}
      >
        {/* Decorative overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <RoomSearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      {/* Results Section - With container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {searchParams && (
          <div
            className="bg-white p-6 mb-8 relative overflow-hidden"
            style={{
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(10, 79, 134, 0.1)",
            }}
          >
            {/* Decorative accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background:
                  "linear-gradient(90deg, #0a4f86 0%, #0d6eab 50%, #0a4f86 100%)",
              }}
            />

            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center text-gray-700">
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2">
                  <CalendarOutlined className="text-[#0a4f86] text-lg" />
                  <span className="font-semibold">
                    {searchParams.check_in} → {searchParams.check_out}
                  </span>
                </div>
                {searchParams.promo_code && (
                  <Tag
                    color="gold"
                    className="font-semibold px-3 py-1"
                    style={{ fontSize: "14px" }}
                  >
                    🎫 {searchParams.promo_code}
                  </Tag>
                )}
              </div>

              {/* Filter by Floor */}
              <div className="flex items-center gap-3">
                <span className="text-gray-700 font-semibold">
                  Lọc theo tầng:
                </span>
                <Select
                  placeholder="Tất cả tầng"
                  allowClear
                  style={{ width: 200, borderRadius: 0 }}
                  value={floorFilter}
                  onChange={(value) => setFloorFilter(value || null)}
                  size="large"
                >
                  {Array.isArray(floors) &&
                    floors.map((floor) => (
                      <Select.Option key={floor.id} value={floor.id}>
                        {floor.name}
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
        ) : Object.keys(roomsByType).length === 0 ? (
          <Empty
            description="Không tìm thấy phòng trống"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate("/")}>
              Quay về trang chủ
            </Button>
          </Empty>
        ) : (
          <Row gutter={24}>
            {/* Left Column: Room Type Cards with Collapse */}
            <Col xs={24} lg={16}>
              <div className="space-y-6">
                {Object.entries(roomsByType).map(([typeId, roomsInType]) => {
                  const roomType = roomTypes.find(
                    (rt) => rt.id === Number(typeId)
                  );

                  return (
                    <RoomTypeCard
                      key={typeId}
                      roomType={roomType}
                      roomsInType={roomsInType}
                      numRooms={numRooms}
                      selectedRoomIds={selectedRoomIds}
                      roomsConfig={roomsConfig}
                      onSelectRoomType={handleSelectRoomType}
                      onRoomSelect={handleRoomSelect}
                      onGuestChange={handleGuestChange}
                    />
                  );
                })}
              </div>
            </Col>

            {/* Right Column: Booking Sidebar */}
            <Col xs={24} lg={8}>
              <div className="sticky top-0">
                {searchParams && (
                  <BookingSidebar
                    checkIn={searchParams.check_in}
                    checkOut={searchParams.check_out}
                    rooms={roomsConfig.map((config) => {
                      const room = rooms.find((r) => r.id === config.room_id);
                      return {
                        id: room?.id || 0,
                        name: room?.name || "",
                        type_name: "",
                        price: room?.price || 0,
                        num_adults: config.num_adults,
                        num_children: config.num_children,
                      };
                    })}
                    promoCode={searchParams.promo_code}
                    onCheckout={handleBooking}
                    loading={loading}
                  />
                )}
              </div>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};

export default RoomSearchResults;
