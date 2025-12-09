import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { message, Spin, Empty, Button, Tag, Row, Col } from "antd";
import { searchAvailableRooms } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import type { Room, RoomSearchParams } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
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

  // Fetch room types
  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  // State cho multi-room selection (giữ lại cho RoomTypeCard, nhưng không dùng cho booking payload nữa)
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [numRooms, setNumRooms] = useState(1);
  const [roomsConfig, setRoomsConfig] = useState<RoomBookingConfig[]>([]);

  // State cho nhiều loại phòng đã xác nhận
  const [confirmedBookings, setConfirmedBookings] = useState<
    Array<{
      roomTypeId: number;
      roomTypeName: string;
      roomPrice: number;
      roomsConfig: RoomBookingConfig[];
      numRooms: number;
    }>
  >([]);

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
            num_babies: 0,
          },
        ]);
      }
    },
    [numRooms, roomsConfig, selectedRoomIds]
  );

  // Đã chuyển toàn bộ logic booking sang confirmedBookings và sidebar checkout

  // Group rooms by room type
  const roomsByType = useMemo(
    () =>
      rooms.reduce(
        (acc, room) => {
          if (!acc[room.type_id]) {
            acc[room.type_id] = [];
          }
          acc[room.type_id].push(room);
          return acc;
        },
        {} as Record<number, Room[]>
      ),
    [rooms]
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5" }}>
      {/* Search Bar Section */}
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <RoomSearchBar onSearch={handleSearch} loading={loading} />
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {searchParams && (
          <div
            className="bg-white p-4 mb-6"
            style={{
              border: "1px solid #e0e0e0",
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-blue-600" />
                <span className="font-medium">
                  {searchParams.check_in} - {searchParams.check_out}
                </span>
                <span className="text-gray-600">
                  ({numRooms} phòng, {searchParams.num_adults || 1} người lớn
                  {searchParams.num_children
                    ? `, ${searchParams.num_children} trẻ em`
                    : ""}
                  )
                </span>
              </div>
              {searchParams.promo_code && (
                <Tag color="gold">Mã khuyến mãi: {searchParams.promo_code}</Tag>
              )}
            </div>
          </div>
        )}

        {/* Room count info */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Vui lòng chọn phòng ({Object.keys(roomsByType).length} loại phòng
            tìm thấy)
          </h2>
        </div>

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
              <div className="space-y-3">
                {Object.entries(roomsByType).map(([typeId, roomsInType]) => {
                  const roomType = roomTypes.find(
                    (rt) => rt.id === Number(typeId)
                  );
                  // Nếu số phòng trống < numRooms, chỉ hiện thông báo

                  // Lấy roomsConfig từ confirmedBookings cho room type này
                  const currentBooking = confirmedBookings.find(
                    (b) => b.roomTypeId === Number(typeId)
                  );
                  const currentRoomsConfig = currentBooking?.roomsConfig || [];

                  console.log("📦 RoomTypeCard config:", roomType?.name, {
                    typeId,
                    currentRoomsConfig,
                    allBookings: confirmedBookings.map((b) => ({
                      id: b.roomTypeId,
                      name: b.roomTypeName,
                      count: b.roomsConfig.length,
                    })),
                  });

                  return (
                    <RoomTypeCard
                      key={typeId}
                      roomType={roomType}
                      roomsInType={roomsInType}
                      numRooms={numRooms}
                      selectedRoomIds={selectedRoomIds}
                      roomsConfig={currentRoomsConfig}
                      disabled={roomsInType.length < numRooms}
                      onSelectRoomType={(selectedRooms, newRoomsConfig) => {
                        setRoomsConfig(newRoomsConfig);
                        setSelectedRoomIds(selectedRooms.map((r) => r.id));

                        // Thêm hoặc cập nhật loại phòng đã xác nhận
                        setConfirmedBookings((prev) => {
                          const idx = prev.findIndex(
                            (b) => b.roomTypeId === (roomType?.id || 0)
                          );
                          const newBooking = {
                            roomTypeId: roomType?.id || 0,
                            roomTypeName: roomType?.name || "",
                            roomPrice: roomType?.price || 0,
                            numRooms,
                            roomsConfig: newRoomsConfig,
                          };
                          if (idx >= 0) {
                            // Cập nhật loại phòng đã có
                            const updated = [...prev];
                            updated[idx] = newBooking;
                            return updated;
                          } else {
                            // Thêm mới loại phòng
                            return [...prev, newBooking];
                          }
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
                {confirmedBookings.length > 0 && searchParams ? (
                  <BookingSidebar
                    checkIn={searchParams.check_in}
                    checkOut={searchParams.check_out}
                    rooms={confirmedBookings.flatMap((booking) =>
                      booking.roomsConfig.map((config, idx) => {
                        const room = rooms.find((r) => r.id === config.room_id);
                        return {
                          id: room?.id || 0,
                          name: room?.name || `Phòng ${idx + 1}`,
                          type_name: booking.roomTypeName,
                          price: config.price || booking.roomPrice,
                          num_adults: config.num_adults,
                          num_children: config.num_children,
                          num_babies: config.num_babies || 0,
                          extra_fees: config.extra_fees || 0,
                          base_price: config.base_price,
                          extra_adult_fees: config.extra_adult_fees || 0,
                          extra_child_fees: config.extra_child_fees || 0,
                          extra_adults_count: config.extra_adults_count || 0,
                          extra_children_count:
                            config.extra_children_count || 0,
                        };
                      })
                    )}
                    promoCode={searchParams.promo_code}
                    onRemoveRoom={(index) => {
                      // Tìm phòng cần xóa trong confirmedBookings
                      let currentIndex = 0;
                      for (let i = 0; i < confirmedBookings.length; i++) {
                        const booking = confirmedBookings[i];
                        if (currentIndex + booking.roomsConfig.length > index) {
                          const roomIndexInBooking = index - currentIndex;
                          const updatedRoomsConfig = [...booking.roomsConfig];
                          updatedRoomsConfig.splice(roomIndexInBooking, 1);

                          if (updatedRoomsConfig.length === 0) {
                            // Xóa toàn bộ booking nếu không còn phòng
                            setConfirmedBookings((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            );
                          } else {
                            // Cập nhật lại roomsConfig
                            setConfirmedBookings((prev) => {
                              const newBookings = [...prev];
                              newBookings[i] = {
                                ...newBookings[i],
                                roomsConfig: updatedRoomsConfig,
                              };
                              return newBookings;
                            });
                          }
                          break;
                        }
                        currentIndex += booking.roomsConfig.length;
                      }
                    }}
                    onCheckout={() => {
                      // Gộp toàn bộ roomsConfig của các loại phòng
                      const allRoomsConfig = confirmedBookings.flatMap(
                        (booking) =>
                          booking.roomsConfig.map((cfg) => ({
                            ...cfg,
                            room_type_id: booking.roomTypeId,
                            room_type_name: booking.roomTypeName,
                            room_type_price: booking.roomPrice,
                          }))
                      );

                      // Chuẩn hóa cho backend: tạo mảng items
                      const items = allRoomsConfig.map((cfg) => ({
                        room_id: cfg.room_id,
                        num_adults: cfg.num_adults,
                        num_children: cfg.num_children,
                        room_type_id: cfg.room_type_id,
                        room_type_name: cfg.room_type_name,
                        room_type_price: cfg.room_type_price,
                        check_in: searchParams.check_in,
                        check_out: searchParams.check_out,
                      }));

                      navigate("/booking/multi-create", {
                        state: {
                          searchParams,
                          roomsConfig: allRoomsConfig,
                          confirmedBookings,
                          selectedRoomIds: allRoomsConfig.map(
                            (cfg) => cfg.room_id
                          ),
                          items,
                        },
                      });
                    }}
                    loading={loading}
                  />
                ) : (
                  <div
                    className="bg-white p-6"
                    style={{
                      border: "1px solid #e0e0e0",
                    }}
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
