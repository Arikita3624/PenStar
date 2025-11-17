import React from "react";
import { Card, Row, Col, Button, Select } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { RoomCardProps } from "@/types/roomBooking";

const RoomCard: React.FC<RoomCardProps> = React.memo(
  ({
    room,
    isSelected,
    config,
    selectedRoomIds,
    numRooms,
    onRoomSelect,
    onGuestChange,
  }) => {
    return (
      <Card
        className="mb-3"
        style={{
          border: isSelected ? "1px solid #52c41a" : "1px solid #e0e0e0",
          boxShadow: "none",
        }}
      >
        <Row gutter={12} align="middle">
          {/* Room Image */}
          <Col xs={24} sm={6}>
            <div
              style={{
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                alt={room.name}
                src={room.thumbnail}
                style={{
                  width: "100%",
                  height: "90px",
                  objectFit: "cover",
                }}
              />
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "#52c41a",
                    color: "white",
                    padding: "2px 6px",
                    fontSize: "10px",
                    fontWeight: "600",
                  }}
                >
                  Đã chọn
                </div>
              )}
            </div>
          </Col>

          {/* Room Info */}
          <Col xs={24} sm={12}>
            <h4
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "5px",
                color: "#262626",
              }}
            >
              {room.name}
            </h4>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "4px",
                fontSize: "11px",
                color: "#595959",
              }}
            >
              <span>
                <UserOutlined /> {room.capacity} người
              </span>
              {room.max_adults && <span>Người lớn: {room.max_adults}</span>}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#8c8c8c",
                marginBottom: "5px",
              }}
            >
              Giường đôi · {room.capacity * 10} m²
            </div>

            <Link
              to={`/rooms/${room.id}`}
              style={{
                fontSize: "11px",
                color: "#0a4f86",
                fontWeight: "500",
              }}
            >
              Xem chi tiết →
            </Link>
          </Col>

          {/* Price & Action */}
          <Col xs={24} sm={6} style={{ textAlign: "right" }}>
            <div style={{ marginBottom: "6px" }}>
              <div
                style={{
                  fontSize: "9px",
                  color: "#8c8c8c",
                  marginBottom: "2px",
                }}
              >
                Giá / đêm
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "#0a4f86",
                }}
              >
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(room.price))}
              </div>
            </div>

            <Button
              type="primary"
              size="small"
              block
              onClick={() => onRoomSelect(room)}
              disabled={!isSelected && selectedRoomIds.length >= numRooms}
              style={{
                background: isSelected
                  ? "#52c41a"
                  : "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                borderColor: "transparent",
                borderRadius: 0,
                fontWeight: "600",
                height: "30px",
                fontSize: "11px",
              }}
            >
              {isSelected ? "Đã chọn" : "Chọn phòng"}
            </Button>
          </Col>
        </Row>

        {/* Guest Configuration (show when selected) */}
        {isSelected && config && (
          <div
            style={{
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid #f0f0f0",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#262626",
              }}
            >
              Chọn số người - Phòng {selectedRoomIds.indexOf(room.id) + 1}
            </div>
            <Row gutter={8}>
              <Col span={8}>
                <div
                  style={{
                    marginBottom: "4px",
                    fontSize: "11px",
                    color: "#595959",
                  }}
                >
                  Người lớn
                </div>
                <Select
                  value={config.num_adults}
                  onChange={(value) =>
                    onGuestChange(room.id, "num_adults", value)
                  }
                  className="w-full"
                  size="small"
                >
                  {Array.from(
                    {
                      length: room.max_adults || room.capacity,
                    },
                    (_, i) => i + 1
                  ).map((num) => (
                    <Select.Option key={num} value={num}>
                      {num}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    marginBottom: "4px",
                    fontSize: "11px",
                    color: "#595959",
                  }}
                >
                  Trẻ em (6-11 tuổi)
                </div>
                <Select
                  value={config.num_children}
                  onChange={(value) =>
                    onGuestChange(room.id, "num_children", value)
                  }
                  className="w-full"
                  size="small"
                >
                  {Array.from(
                    {
                      length: (room.max_children || room.capacity) + 1,
                    },
                    (_, i) => i
                  ).map((num) => (
                    <Select.Option key={num} value={num}>
                      {num}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <div
                  style={{
                    marginBottom: "4px",
                    fontSize: "11px",
                    color: "#595959",
                  }}
                >
                  Em bé (0-5 tuổi)
                </div>
                <Select
                  defaultValue={0}
                  className="w-full"
                  size="small"
                  disabled
                >
                  <Select.Option value={0}>0</Select.Option>
                </Select>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    );
  }
);

RoomCard.displayName = "RoomCard";

export default RoomCard;
