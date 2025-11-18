/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // State cho confirmed booking (sau khi click Xác nhận)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    roomsConfig: any;
    roomTypeId: number;
    roomTypeName: string;
    roomPrice: number;
    guestInfo: {
      numAdults: number;
      numChildren: number;
      childrenAges: number[];
    };
    numRooms: number;
  } | null>(null);

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

  // ...existing code...

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

  const handleBooking = () => {
    if (selectedRoomIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 phòng");
      return;
    }

    if (selectedRoomIds.length !== numRooms) {
      message.warning(`Vui lòng chọn đúng ${numRooms} phòng`);
      return;
    }

    if (!searchParams) {
      message.error("Thiếu thông tin tìm kiếm. Vui lòng tìm kiếm lại!");
      return;
    }

    // Truyền toàn bộ roomsConfig (giữ room_id, num_adults, num_children, children_ages)
    navigate("/booking/multi-create", {
      state: {
        selectedRoomIds,
        searchParams,
        roomsConfig,
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
      filteredRooms.reduce(
        (acc, room) => {
          if (!acc[room.type_id]) {
            acc[room.type_id] = [];
          }
          acc[room.type_id].push(room);
          return acc;
        },
        {} as Record<number, Room[]>
      ),
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
                  // Nếu số phòng trống < numRooms, chỉ hiện thông báo
                  return (
                    <RoomTypeCard
                      key={typeId}
                      roomType={roomType}
                      roomsInType={roomsInType}
                      numRooms={numRooms}
                      selectedRoomIds={selectedRoomIds}
                      roomsConfig={roomsConfig}
                      disabled={roomsInType.length < numRooms}
                      onSelectRoomType={(selectedRooms, newRoomsConfig) => {
                        setRoomsConfig(newRoomsConfig);
                        setSelectedRoomIds(selectedRooms.map((r) => r.id));

                        // Lưu từng phòng với số người lớn/trẻ em riêng biệt
                        setConfirmedBooking({
                          roomTypeId: roomType?.id || 0,
                          roomTypeName: roomType?.name || "",
                          roomPrice: roomType?.price || 0,
                          guestInfo: {
                            num_adults: undefined, // Không dùng tổng cho từng phòng
                            num_children: undefined,
                            childrenAges: [],
                          },
                          numRooms,
                          roomsConfig: newRoomsConfig, // Thêm roomsConfig để truyền từng phòng
                        });
                      }}
                      onRoomSelect={handleRoomSelect}
                    />
                  );
                })}
              </div>
            </Col>

            {/* Right Column: Booking Sidebar - Show after confirmation */}
            <Col xs={24} lg={8}>
              <div className="sticky top-0">
                {confirmedBooking && searchParams ? (
                  <BookingSidebar
                    checkIn={searchParams.check_in}
                    checkOut={searchParams.check_out}
                    rooms={confirmedBooking.roomsConfig.map(
                      (config: any, index: number) => ({
                        id: config.room_id || 0,
                        name: `Phòng ${index + 1} (Tự động chọn)`,
                        type_name: confirmedBooking.roomTypeName,
                        price: confirmedBooking.roomPrice,
                        num_adults: config.num_adults,
                        num_children: config.num_children,
                      })
                    )}
                    promoCode={searchParams.promo_code}
                    onCheckout={() => {
                      // Navigate to booking page, truyền đúng roomsConfig
                      navigate("/booking/multi-create", {
                        state: {
                          searchParams,
                          roomsConfig: confirmedBooking.roomsConfig,
                          numRooms: confirmedBooking.numRooms,
                          autoAssign: true,
                          roomTypeId: confirmedBooking.roomTypeId,
                          roomPrice: confirmedBooking.roomPrice,
                        },
                      });
                    }}
                    loading={loading}
                  />
                ) : searchParams && selectedRoomIds.length > 0 ? (
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
                ) : searchParams ? (
                  <div
                    className="bg-white p-6 shadow-lg"
                    style={{ borderRadius: 0 }}
                  >
                    <div className="text-center text-gray-500">
                      <div className="mb-4">
                        <svg
                          className="w-16 h-16 mx-auto text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Chưa chọn phòng nào
                      </h3>
                      <p className="text-sm">
                        Nhấn "Xác nhận" trên loại phòng để hệ thống tự động chọn
                        phòng phù hợp
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
};

export default RoomSearchResults;
