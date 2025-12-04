/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo } from "react";
import {
  Badge,
  Button,
  Collapse,
  Row,
  Col,
  Tag,
  InputNumber,
  Space,
  Typography,
  Alert,
} from "antd";
import {
  DownOutlined,
  UserOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { RoomTypeCardProps } from "@/types/roomBooking";

const { Panel } = Collapse;
const { Text } = Typography;

const RoomTypeCard: React.FC<RoomTypeCardProps> = React.memo(
  ({ roomType, roomsInType, onSelectRoomType }) => {
    if (!roomType) return null;

    const thumbnail = roomType.thumbnail || "/placeholder-room.jpg";
    const [isExpanded, setIsExpanded] = useState(false);

    // Khởi tạo mảng độc lập cho từng phòng

    const maxSelectableRooms = roomsInType.filter(
      (room) => room.status === "available"
    ).length;
    const [selectedRoomsCount, setSelectedRoomsCount] = useState(0);
    // Guest arrays are always synced with selectedRoomsCount
    const [numAdultsList, setNumAdultsList] = useState<number[]>([]);
    const [numChildrenList, setNumChildrenList] = useState<number[]>([]);
    const [childrenAgesList, setChildrenAgesList] = useState<number[][]>([]);

    // Sync guest arrays when selectedRoomsCount changes
    React.useEffect(() => {
      setNumAdultsList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(Array(selectedRoomsCount - arr.length).fill(1));
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
      setNumChildrenList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(Array(selectedRoomsCount - arr.length).fill(0));
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
      setChildrenAgesList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(
            Array.from({ length: selectedRoomsCount - arr.length }, () => [])
          );
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
    }, [selectedRoomsCount]);

    const maxAdults = roomType.max_adults ?? 10;
    const capacity = roomType.capacity ?? 10;

    const suitableRooms = useMemo(() => {
      return roomsInType.filter((room) => room.status === "available");
    }, [roomsInType]);

    // Chỉ block/cảnh báo khi số phòng chọn vượt quá số phòng trống
    const isDisabled = selectedRoomsCount > maxSelectableRooms;
    const inputDisabled = isDisabled;
    const showNotEnoughRoomsWarning = selectedRoomsCount > maxSelectableRooms;

    // Kiểm tra vượt quá số lượng người lớn cho từng phòng (an toàn, tuân thủ)
    const overAdultsLimit = numAdultsList.some((n) => n > maxAdults);

    // Kiểm tra tổng số khách vượt quá capacity cho từng phòng
    const overCapacity = Array.from({ length: selectedRoomsCount }).some(
      (_, idx) => {
        return numAdultsList[idx] + numChildrenList[idx] > capacity;
      }
    );

    // Tổng hợp: có vấn đề nếu vượt người lớn HOẶC vượt capacity
    const overLimit = overAdultsLimit || overCapacity;
    return (
      <div
        className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 mb-6 overflow-hidden"
        style={{
          border: "1px solid rgba(10, 79, 134, 0.1)",
          background: "linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%)",
          borderRadius: 0,
          opacity: isDisabled ? 0.75 : 1,
          pointerEvents: isDisabled && !isExpanded ? "none" : "auto",
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
          // Luôn cho phép mở, dù không đủ phòng
        >
          <Panel
            header={
              <div className="p-4">
                <Row gutter={16} align="top">
                  <Col xs={24} md={6}>
                    <div style={{ overflow: "hidden" }}>
                      <img
                        src={
                          thumbnail.startsWith("http")
                            ? thumbnail
                            : `http://localhost:5000${thumbnail}`
                        }
                        alt={roomType.name || "Room"}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          display: "block",
                          filter: isDisabled ? "grayscale(80%)" : "none",
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://via.placeholder.com/400x200?text=No+Image";
                        }}
                      />
                    </div>
                  </Col>
                  <Col xs={24} md={18}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="text-2xl font-bold"
                          style={{
                            background:
                              "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {roomType.name || "Loại phòng"}
                        </h3>
                        <div className="text-xl font-bold text-red-600 text-right ml-4">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(Number(roomType.price) || 0)}
                          <div className="text-xs text-gray-500 font-normal">
                            / đêm
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge
                          count={`${suitableRooms.length} phòng trống`}
                          style={{
                            background: isDisabled
                              ? "#ff4d4f"
                              : "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                            fontSize: "13px",
                            padding: "4px 12px",
                            height: "auto",
                            borderRadius: 0,
                            boxShadow: "0 2px 8px rgba(10, 79, 134, 0.25)",
                          }}
                        />
                        {roomType.capacity != null && (
                          <Badge
                            count={
                              <span>
                                <TeamOutlined /> Sức chứa: {roomType.capacity}{" "}
                                người
                              </span>
                            }
                            style={{
                              background: "#faad14",
                              fontSize: "12px",
                              padding: "4px 12px",
                              height: "auto",
                              borderRadius: 0,
                            }}
                          />
                        )}
                      </div>

                      {roomType.description && (
                        <div
                          className="mt-3 text-gray-600 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: roomType.description,
                          }}
                        />
                      )}

                      {roomType.amenities && roomType.amenities.length > 0 && (
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

                      {/* Hiển thị cảnh báo ngay trong header nếu số phòng chọn vượt quá số phòng trống */}
                      {showNotEnoughRoomsWarning && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <Text
                            type="danger"
                            className="text-sm flex items-center gap-2"
                          >
                            <InfoCircleOutlined />
                            <strong>Không đủ phòng:</strong> Đã chọn{" "}
                            {selectedRoomsCount} phòng, nhưng chỉ còn{" "}
                            {suitableRooms.length} phòng trống.
                          </Text>
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            }
            key="1"
            className="border-none"
            style={{ borderRadius: 0 }}
          >
            {/* Nội dung mở rộng */}
            <div className="p-6 bg-white" style={{ borderRadius: 0 }}>
              <div className="max-w-2xl">
                {/* Cảnh báo lớn ở đầu phần mở rộng */}
                {showNotEnoughRoomsWarning && (
                  <Alert
                    message="Không thể đặt loại phòng này"
                    description={
                      <span>
                        Đã chọn <strong>{selectedRoomsCount} phòng</strong>,
                        nhưng hiện chỉ còn{" "}
                        <strong>{suitableRooms.length} phòng trống</strong>. Vui
                        lòng chọn loại phòng khác hoặc giảm số lượng phòng.
                      </span>
                    }
                    type="error"
                    showIcon
                    className="mb-6"
                  />
                )}

                <h4 className="text-lg font-semibold mb-2">
                  Chọn số lượng phòng:
                  <InputNumber
                    min={0}
                    max={maxSelectableRooms}
                    value={selectedRoomsCount}
                    onChange={(value) => {
                      const count = value ?? 0;
                      setSelectedRoomsCount(count);
                      // Guest arrays will sync automatically via useEffect
                    }}
                    style={{ marginLeft: 12, width: 100 }}
                  />
                </h4>
                <Space direction="vertical" size="large" className="w-full">
                  {Array.from({ length: selectedRoomsCount }).map(
                    (_, roomIdx) => (
                      <div
                        key={roomIdx}
                        className="border p-3 rounded mb-2 bg-gray-50"
                        style={{
                          opacity: inputDisabled ? 0.6 : 1,
                          pointerEvents: inputDisabled ? "none" : "auto",
                        }}
                      >
                        <div className="font-semibold mb-2">
                          Phòng {roomIdx + 1}
                        </div>
                        <Row gutter={16} align="middle">
                          <Col xs={24} md={12}>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              <UserOutlined className="mr-2" />
                              Số người lớn *
                            </label>
                            <InputNumber
                              min={1}
                              max={maxAdults}
                              value={numAdultsList[roomIdx]}
                              disabled={inputDisabled}
                              onChange={(value) => {
                                const newList = [...numAdultsList];
                                newList[roomIdx] = value ?? 1;
                                setNumAdultsList(newList);
                              }}
                              className="w-full"
                              size="large"
                              placeholder="Nhập số người lớn"
                            />
                            <Text
                              type="secondary"
                              className="text-xs mt-1 block"
                            >
                              Tối đa {maxAdults} người lớn
                            </Text>
                          </Col>
                          <Col xs={24} md={12}>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                              <TeamOutlined className="mr-2" />
                              Số trẻ em
                            </label>
                            <InputNumber
                              min={0}
                              max={capacity}
                              value={numChildrenList[roomIdx]}
                              disabled={inputDisabled}
                              onChange={(value) => {
                                const newCount = value ?? 0;
                                const newChildrenList = [...numChildrenList];
                                newChildrenList[roomIdx] = newCount;
                                setNumChildrenList(newChildrenList);

                                const newAgesList = [...childrenAgesList];
                                const currentAges = newAgesList[roomIdx] || [];

                                if (newCount > currentAges.length) {
                                  newAgesList[roomIdx] = [
                                    ...currentAges,
                                    ...Array(
                                      newCount - currentAges.length
                                    ).fill(0),
                                  ];
                                } else {
                                  newAgesList[roomIdx] = currentAges.slice(
                                    0,
                                    newCount
                                  );
                                }
                                setChildrenAgesList(newAgesList);
                              }}
                              className="w-full"
                              size="large"
                              placeholder="Nhập số trẻ em"
                            />
                            <Text
                              type="secondary"
                              className="text-xs mt-1 block"
                            >
                              Tổng: {numAdultsList[roomIdx]} người lớn +{" "}
                              {numChildrenList[roomIdx]} trẻ em
                            </Text>
                          </Col>
                        </Row>
                      </div>
                    )
                  )}
                </Space>

                {/* Nút xác nhận - bị disable nếu không đủ phòng */}
                {overLimit && (
                  <Alert
                    message={
                      overAdultsLimit
                        ? "Số người lớn vượt quá quy định!"
                        : "Vượt quá sức chứa phòng!"
                    }
                    description={
                      overAdultsLimit
                        ? `Số người lớn tối đa cho loại phòng này là ${maxAdults} người/phòng.`
                        : `Tổng số khách (người lớn + trẻ em) không được vượt quá sức chứa phòng (${capacity} người).`
                    }
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
                <Button
                  type="primary"
                  size="large"
                  className="w-full mt-4"
                  style={{
                    background:
                      isDisabled || overLimit
                        ? "#d9d9d9"
                        : "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                    border: "none",
                    height: "48px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: isDisabled || overLimit ? "not-allowed" : "pointer",
                  }}
                  disabled={isDisabled || overLimit}
                  onClick={() => {
                    if (overLimit || isDisabled) return;
                    const newRoomsConfig = Array.from({
                      length: selectedRoomsCount,
                    }).map((_, idx) => ({
                      room_id: suitableRooms[idx]?.id || 0,
                      num_adults: numAdultsList[idx],
                      num_children: numChildrenList[idx],
                    }));
                    onSelectRoomType(
                      suitableRooms.slice(0, selectedRoomsCount),
                      newRoomsConfig
                    );
                  }}
                >
                  {isDisabled
                    ? "Chọn số lượng phòng"
                    : overAdultsLimit
                      ? "Vượt quá số người lớn"
                      : overCapacity
                        ? "Vượt quá sức chứa phòng"
                        : "Xác nhận"}
                </Button>

                {/* Thông báo bổ sung */}
                {isDisabled && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-300 mt-3">
                    <Text type="warning" className="text-xs">
                      Loại phòng này hiện không đủ số lượng trống. Vui lòng chọn
                      loại phòng khác.
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </Collapse>
      </div>
    );
  }
);

export default RoomTypeCard;
