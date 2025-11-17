import React, { useState, useMemo } from "react";
import { Badge, Button, Collapse, Row, Col, Tag } from "antd";
import { DownOutlined } from "@ant-design/icons";
import type { RoomTypeCardProps } from "@/types/roomBooking";
import RoomCard from "./RoomCard";

const { Panel } = Collapse;

const RoomTypeCard: React.FC<RoomTypeCardProps> = React.memo(
  ({
    roomType,
    roomsInType,
    numRooms,
    selectedRoomIds,
    roomsConfig,
    onSelectRoomType,
    onRoomSelect,
    onGuestChange,
  }) => {
    const thumbnail = roomType?.thumbnail || "/placeholder-room.jpg";
    const [isExpanded, setIsExpanded] = useState(false);

    // Chỉ render rooms khi panel được mở
    const roomsToRender = useMemo(() => {
      if (!isExpanded) return [];
      return roomsInType;
    }, [isExpanded, roomsInType]);

    return (
      <div
        className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 mb-6 overflow-hidden"
        style={{
          border: "1px solid rgba(10, 79, 134, 0.1)",
          background: "linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%)",
          borderRadius: 0,
        }}
      >
        <Collapse
          expandIcon={({ isActive }) => (
            <div
              className="w-8 h-8 flex items-center justify-center transition-all duration-300"
              style={{ background: "#f1f5f9" }}
            >
              <DownOutlined
                rotate={isActive ? 180 : 0}
                className="text-base text-[#0a4f86]"
              />
            </div>
          )}
          className="bg-transparent border-none"
          style={{ borderRadius: 0 }}
          onChange={(keys) => setIsExpanded(keys.length > 0)}
        >
          <Panel
            header={
              <div className="p-4">
                <Row gutter={16} align="top">
                  <Col xs={24} md={6}>
                    {thumbnail && (
                      <div style={{ overflow: "hidden" }}>
                        <img
                          src={
                            thumbnail.startsWith("http")
                              ? thumbnail
                              : `http://localhost:5000${thumbnail}`
                          }
                          alt={roomType?.name || "Room"}
                          style={{
                            width: "100%",
                            height: "180px",
                            objectFit: "cover",
                            display: "block",
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/400x200?text=No+Image";
                          }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col xs={24} md={18}>
                    <div>
                      <h3
                        className="text-2xl font-bold mb-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {roomType?.name || "Loại phòng"}
                      </h3>
                      <Badge
                        count={`${roomsInType.length} phòng trống`}
                        style={{
                          background:
                            "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                          fontSize: "13px",
                          padding: "4px 12px",
                          height: "auto",
                          borderRadius: 0,
                          boxShadow: "0 2px 8px rgba(10, 79, 134, 0.25)",
                        }}
                      />

                      {roomType?.description && (
                        <div
                          className="mt-3 text-gray-600 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: roomType.description,
                          }}
                        />
                      )}

                      {roomType?.amenities && roomType.amenities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {roomType.amenities
                            .slice(0, 4)
                            .map((amenity, idx) => (
                              <Tag
                                key={idx}
                                className="text-xs"
                                style={{
                                  background: "#e6f4ff",
                                  border: "1px solid #91caff",
                                  color: "#0958d9",
                                  borderRadius: 0,
                                }}
                              >
                                {amenity}
                              </Tag>
                            ))}
                          {roomType.amenities.length > 4 && (
                            <Tag
                              className="text-xs"
                              style={{
                                background: "#fafafa",
                                border: "1px solid #d9d9d9",
                                color: "#595959",
                                borderRadius: 0,
                              }}
                            >
                              +{roomType.amenities.length - 4} khác
                            </Tag>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        {roomsInType.length < numRooms ? (
                          <div
                            className="px-4 py-2 text-center"
                            style={{
                              background: "#f5f5f5",
                              border: "1px solid #d9d9d9",
                            }}
                          >
                            <div className="text-red-500 font-semibold text-sm">
                              Đã hết phòng
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Chỉ còn {roomsInType.length} phòng
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRoomType(roomsInType);
                            }}
                            style={{
                              background:
                                "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                              borderColor: "transparent",
                              borderRadius: 0,
                              fontWeight: "600",
                              height: "36px",
                              fontSize: "14px",
                              padding: "0 20px",
                              boxShadow: "0 2px 8px rgba(10, 79, 134, 0.3)",
                            }}
                          >
                            Chọn {numRooms} phòng
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            }
            key="1"
            className="border-none"
            style={{ borderRadius: 0 }}
          >
            <div className="space-y-3 mt-4 ml-8">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <span className="w-0.5 h-4 bg-gradient-to-b from-[#0a4f86] to-[#0d6eab]"></span>
                Phòng trống ({roomsInType.length})
              </h4>
              {isExpanded &&
                roomsToRender.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  const config = roomsConfig.find((c) => c.room_id === room.id);

                  return (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isSelected={isSelected}
                      config={config}
                      selectedRoomIds={selectedRoomIds}
                      numRooms={numRooms}
                      onRoomSelect={onRoomSelect}
                      onGuestChange={onGuestChange}
                    />
                  );
                })}
            </div>
          </Panel>
        </Collapse>
      </div>
    );
  }
);

RoomTypeCard.displayName = "RoomTypeCard";

export default RoomTypeCard;
