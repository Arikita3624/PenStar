/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo } from "react";
import { Button, Collapse, Row, Col, Alert, Modal, Select } from "antd";
import {
  ExpandOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  WifiOutlined,
  SnippetsOutlined,
  HolderOutlined,
  PhoneOutlined,
  HomeOutlined,
  FundViewOutlined,
} from "@ant-design/icons";
import type { RoomTypeCardProps } from "@/types/roomBooking";

const { Panel } = Collapse;

const RoomTypeCard: React.FC<RoomTypeCardProps> = React.memo(
  ({ roomType, roomsInType, onSelectRoomType, roomsConfig }) => {
    if (!roomType) return null;

    const thumbnail = roomType.thumbnail || "/placeholder-room.jpg";
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    // const isInitialExpansion = React.useRef(false); // Removed: unused

    // Khởi tạo mảng độc lập cho từng phòng

    const maxSelectableRooms = roomsInType.filter(
      (room) => room.status === "available"
    ).length;
    const [selectedRoomsCount, setSelectedRoomsCount] = useState(0);
    const prevRoomsConfigLength = React.useRef(0);

    // Sync selectedRoomsCount với roomsConfig từ parent (chỉ khi bị xóa từ bên ngoài)
    React.useEffect(() => {
      const currentRoomTypeCount = roomsConfig.filter(
        (config) => config.room_type_id === roomType.id
      ).length;

      console.log("🔄 Sync:", roomType.name, {
        current: currentRoomTypeCount,
        prev: prevRoomsConfigLength.current,
        selected: selectedRoomsCount,
      });

      // Chỉ sync khi roomsConfig giảm từ bên ngoài (bị xóa)
      if (currentRoomTypeCount < prevRoomsConfigLength.current) {
        console.log("✅ Reset to:", currentRoomTypeCount);
        setSelectedRoomsCount(currentRoomTypeCount);

        // Sync lại guest data từ roomsConfig
        const currentConfigs = roomsConfig.filter(
          (config) => config.room_type_id === roomType.id
        );
        setNumAdultsList(currentConfigs.map((c) => c.num_adults || 1));
        setNumChildrenList(currentConfigs.map((c) => c.num_children || 0));
        setChildrenAgesList(currentConfigs.map(() => []));
      }
      prevRoomsConfigLength.current = currentRoomTypeCount;
    }, [roomsConfig, roomType.id, roomType.name, selectedRoomsCount]);
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

    const suitableRooms = useMemo(() => {
      return roomsInType.filter((room) => room.status === "available");
    }, [roomsInType]);

    // Calculate extra fees for a specific room
    const calculateRoomExtraFees = (roomIndex: number) => {
      const numAdults = numAdultsList[roomIndex] || 0;
      const numChildren = numChildrenList[roomIndex] || 0;
      // Em bé KHÔNG tính phụ phí

      const baseAdults = roomType.base_adults || 0;
      const baseChildren = roomType.base_children || 0;
      const extraAdultFee = Number(roomType.extra_adult_fee) || 0;
      const extraChildFee = Number(roomType.extra_child_fee) || 0;

      const extraAdults = Math.max(0, numAdults - baseAdults);
      const extraChildren = Math.max(0, numChildren - baseChildren);

      const adultFees = extraAdults * extraAdultFee;
      const childFees = extraChildren * extraChildFee;

      console.log(`💰 Phòng ${roomIndex + 1}:`, {
        numAdults,
        numChildren,
        baseAdults,
        baseChildren,
        extraAdults,
        extraChildren,
        extraAdultFee,
        extraChildFee,
        adultFees,
        childFees,
      });

      return {
        extraAdults,
        extraChildren,
        adultFees,
        childFees,
        totalExtraFees: adultFees + childFees,
      };
    };

    // Tự động cập nhật sidebar khi có thay đổi
    React.useEffect(() => {
      if (selectedRoomsCount > 0) {
        const newRoomsConfig = Array.from({
          length: selectedRoomsCount,
        }).map((_, idx) => {
          const fees = calculateRoomExtraFees(idx);
          const basePrice = roomType.price || 0; // Lấy giá từ room_types
          const totalPrice = basePrice + fees.totalExtraFees;
          return {
            room_id: suitableRooms[idx]?.id || 0,
            room_type_id: roomType.id,
            num_adults: numAdultsList[idx] || 1,
            num_children: numChildrenList[idx] || 0,
            num_babies:
              childrenAgesList[idx]?.filter((age) => age <= 5).length || 0,
            price: totalPrice, // Giá đã bao gồm phụ phí
            base_price: basePrice, // Giá gốc từ room_types
            extra_fees: fees.totalExtraFees, // Tổng phụ phí
            extra_adult_fees: fees.adultFees, // Phụ phí người lớn
            extra_child_fees: fees.childFees, // Phụ phí trẻ em
            extra_adults_count: fees.extraAdults, // Số người lớn thêm
            extra_children_count: fees.extraChildren, // Số trẻ em thêm
            quantity: 1, // Bổ sung trường quantity cho đúng type
          };
        });
        onSelectRoomType(
          suitableRooms.slice(0, selectedRoomsCount),
          newRoomsConfig
        );
      } else {
        // Nếu chọn 0 phòng, xóa khỏi sidebar
        onSelectRoomType([], []);
      }
    }, [
      selectedRoomsCount,
      numAdultsList,
      numChildrenList,
      childrenAgesList,
      suitableRooms,
      roomType.id,
      roomType.price,
      roomType.base_adults,
      roomType.base_children,
      roomType.extra_adult_fee,
      roomType.extra_child_fee,
    ]);

    // Chỉ block/cảnh báo khi số phòng chọn vượt quá số phòng trống
    const isDisabled = selectedRoomsCount > maxSelectableRooms;
    const showNotEnoughRoomsWarning = selectedRoomsCount > maxSelectableRooms;

    return (
      <>
        <div
          className="bg-white overflow-hidden transition-all duration-200"
          style={{
            border: "1px solid #e0e0e0",
            marginBottom: "12px",
            opacity: isDisabled ? 0.75 : 1,
            pointerEvents: isDisabled && !isExpanded ? "none" : "auto",
          }}
        >
          <Collapse
            expandIcon={() => null}
            className="bg-transparent border-none"
            style={{ borderRadius: 0 }}
            activeKey={isExpanded ? ["1"] : []}
          >
            <Panel
              header={
                <div>
                  <Row gutter={16} align="middle">
                    {/* Phần hình ảnh bên trái */}
                    <Col xs={24} md={11}>
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {/* Nút trái - ngoài ảnh */}
                        {roomType.images && roomType.images.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === 0
                                  ? roomType.images!.length - 1
                                  : prev - 1
                              );
                            }}
                            style={{
                              position: "absolute",
                              left: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "36px",
                              height: "36px",
                              background: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #ddd",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 10,
                              color: "#333",
                            }}
                          >
                            <LeftOutlined style={{ fontSize: "14px" }} />
                          </div>
                        )}

                        {/* Ảnh */}
                        <div
                          style={{
                            width: "100%",
                            height: "200px",
                            overflow: "hidden",
                          }}
                        >
                          {roomType.images && roomType.images.length > 0 ? (
                            <img
                              src={
                                roomType.images[currentImageIndex].startsWith(
                                  "http"
                                )
                                  ? roomType.images[currentImageIndex]
                                  : `http://localhost:5000${roomType.images[currentImageIndex]}`
                              }
                              alt={`${roomType.name} - ${currentImageIndex + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/400x180?text=No+Image";
                              }}
                            />
                          ) : thumbnail ? (
                            <img
                              src={
                                thumbnail.startsWith("http")
                                  ? thumbnail
                                  : `http://localhost:5000${thumbnail}`
                              }
                              alt={roomType.name || "Room"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/400x180?text=No+Image";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#ddd",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                              }}
                            >
                              No Image Available
                            </div>
                          )}
                        </div>

                        {/* Nút phải - ngoài ảnh */}
                        {roomType.images && roomType.images.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === roomType.images!.length - 1
                                  ? 0
                                  : prev + 1
                              );
                            }}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "36px",
                              height: "36px",
                              background: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #ddd",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 10,
                              color: "#333",
                            }}
                          >
                            <RightOutlined style={{ fontSize: "14px" }} />
                          </div>
                        )}
                      </div>
                    </Col>

                    {/* Phần nội dung bên phải */}
                    <Col xs={24} md={13}>
                      <div
                        style={{
                          padding: "12px 0 8px 8px",
                          height: "200px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* Phần thông tin trên */}
                        <div>
                          {/* Tên phòng */}
                          <h3
                            style={{
                              color: "#333",
                              fontSize: "16px",
                              lineHeight: "22px",
                              fontWeight: "600",
                              marginBottom: "8px",
                            }}
                          >
                            {roomType.name || "Loại phòng"}
                          </h3>

                          {/* Thông tin giường, diện tích, hướng nhìn */}
                          <div
                            className="flex gap-3 items-center"
                            style={{ marginBottom: "8px" }}
                          >
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "#666", fontSize: "13px" }}
                            >
                              <span>
                                {roomType.bed_type || "1 giường queen size"}
                              </span>
                            </span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "#666", fontSize: "13px" }}
                            >
                              <ExpandOutlined style={{ fontSize: "13px" }} />
                              <span>{roomType.room_size || 30} m²</span>
                            </span>
                            {/* Hiển thị hướng nhìn nếu có */}
                            {roomType.view_direction && (
                              <span
                                className="flex items-center gap-1"
                                style={{ color: "#666" }}
                              >
                                <span>
                                  <FundViewOutlined />
                                </span>
                                <span>{roomType.view_direction}</span>
                              </span>
                            )}
                          </div>

                          {/* Icon tiện nghi */}
                          <div
                            className="flex gap-3 items-center"
                            style={{ marginBottom: "10px" }}
                          >
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAmenitiesModalOpen(true);
                              }}
                              style={{
                                color: "#1890ff",
                                fontSize: "14px",
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              Xem tất cả tiện nghi
                            </a>
                          </div>
                        </div>

                        {/* Giá và nút chọn phòng - ở dưới cùng */}
                        <div className="flex items-end justify-between">
                          <div>
                            <div
                              style={{
                                color: "#999",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Giá chỉ từ
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#f5a623",
                                  fontSize: "22px",
                                  fontWeight: "700",
                                  lineHeight: "1",
                                }}
                              >
                                {new Intl.NumberFormat("vi-VN").format(
                                  Number(roomType.price) || 0
                                )}{" "}
                                VND
                              </span>
                              <span style={{ color: "#999", fontSize: "12px" }}>
                                / đêm
                              </span>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            disabled={isDisabled}
                            style={{
                              background: "#f5a623",
                              borderColor: "#f5a623",
                              color: "#fff",
                              fontWeight: "600",
                              height: "38px",
                              padding: "0 18px",
                              fontSize: "14px",
                              borderRadius: "4px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(!isExpanded);
                            }}
                          >
                            Chọn phòng
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              }
              key="1"
              className="bg-white"
            >
              {/* Nội dung mở rộng */}
              <div
                className="bg-white"
                style={{ borderTop: "1px dashed #e0e0e0" }}
              >
                <div style={{ padding: "24px" }}>
                  {/* Thông tin giá và max adults */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <UserOutlined
                          style={{ fontSize: "14px", color: "#666" }}
                        />
                        <span style={{ fontSize: "14px", color: "#666" }}>
                          +
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#333",
                            fontWeight: "500",
                          }}
                        >
                          {roomType.max_adults || 2} Người lớn
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CoffeeOutlined
                          style={{ fontSize: "13px", color: "#666" }}
                        />
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          Đã bao gồm ăn sáng
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <CalendarOutlined
                          style={{ fontSize: "13px", color: "#666" }}
                        />
                        <span style={{ fontSize: "13px", color: "#666" }}>
                          Không hoàn trả phí khi hủy phòng
                        </span>
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPolicyModalOpen(true);
                        }}
                        style={{
                          fontSize: "13px",
                          padding: "0",
                          height: "auto",
                          color: "#1890ff",
                          textAlign: "left",
                        }}
                      >
                        Xem chi tiết &gt;
                      </Button>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: "#f5a623",
                          fontSize: "18px",
                          fontWeight: "700",
                        }}
                      >
                        {new Intl.NumberFormat("vi-VN").format(
                          Number(roomType.price) || 0
                        )}{" "}
                        VND
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "400",
                            color: "#666",
                          }}
                        >
                          {" "}
                          / đêm
                        </span>
                      </div>
                    </div>

                    <div>
                      <select
                        aria-label="Chọn số lượng phòng"
                        style={{
                          padding: "8px 32px 8px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                          cursor: "pointer",
                          appearance: "none",
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 8px center",
                        }}
                        value={selectedRoomsCount}
                        onChange={(e) =>
                          setSelectedRoomsCount(Number(e.target.value))
                        }
                      >
                        <option value={0}>0 Phòng</option>
                        {Array.from(
                          { length: Math.min(maxSelectableRooms, 5) },
                          (_, i) => i + 1
                        ).map((num) => (
                          <option key={num} value={num}>
                            {num} Phòng
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>{" "}
                  {/* Cảnh báo nếu không đủ phòng */}
                  {showNotEnoughRoomsWarning && (
                    <Alert
                      message="Không thể đặt loại phòng này"
                      description={
                        <span>
                          Đã chọn <strong>{selectedRoomsCount} phòng</strong>,
                          nhưng hiện chỉ còn{" "}
                          <strong>{suitableRooms.length} phòng trống</strong>.
                          Vui lòng chọn loại phòng khác hoặc giảm số lượng
                          phòng.
                        </span>
                      }
                      type="error"
                      showIcon
                      className="mb-6"
                    />
                  )}
                  {/* Phần chọn số khách - hiển thị form cho từng phòng */}
                  {selectedRoomsCount > 0 &&
                    Array.from({ length: selectedRoomsCount }).map(
                      (_, roomIndex) => {
                        const currentAdults = numAdultsList[roomIndex] || 1;
                        const currentChildren = numChildrenList[roomIndex] || 0;
                        const currentBabies =
                          childrenAgesList[roomIndex]?.filter((age) => age <= 5)
                            .length || 0;
                        const maxOccupancy = roomType.capacity || 4;

                        // Em bé KHÔNG tính vào capacity
                        // Người lớn và trẻ em: tối đa 3 mỗi loại, tổng không quá capacity
                        const maxAdultsOptions = Math.min(
                          3,
                          maxOccupancy - currentChildren
                        );
                        const maxChildrenOptions = Math.min(
                          3,
                          maxOccupancy - currentAdults
                        );
                        const maxBabies = 3;

                        return (
                          <div
                            key={roomIndex}
                            style={{
                              marginTop: "24px",
                              paddingBottom: "20px",
                              borderBottom: "1px solid #e8e8e8",
                            }}
                          >
                            <Row gutter={16} align="middle">
                              <Col xs={6} sm={6}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#333",
                                  }}
                                >
                                  Chọn số người phòng {roomIndex + 1}
                                </div>
                              </Col>

                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Người lớn
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentAdults}
                                  onChange={(value) => {
                                    const newList = [...numAdultsList];
                                    newList[roomIndex] = value;
                                    setNumAdultsList(newList);

                                    // Điều chỉnh trẻ em nếu vượt quá capacity
                                    const total = value + currentChildren;
                                    if (
                                      total > maxOccupancy &&
                                      currentChildren > 0
                                    ) {
                                      const excess = total - maxOccupancy;
                                      const newChildren = Math.max(
                                        0,
                                        currentChildren - excess
                                      );
                                      const newChildrenList = [
                                        ...numChildrenList,
                                      ];
                                      newChildrenList[roomIndex] = newChildren;
                                      setNumChildrenList(newChildrenList);
                                    }
                                  }}
                                  options={Array.from(
                                    { length: maxAdultsOptions },
                                    (_, i) => ({
                                      label: String(i + 1),
                                      value: i + 1,
                                    })
                                  )}
                                />
                              </Col>

                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Trẻ em (6-11 tuổi)
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentChildren}
                                  onChange={(value) => {
                                    const newList = [...numChildrenList];
                                    newList[roomIndex] = value;
                                    setNumChildrenList(newList);
                                  }}
                                  options={Array.from(
                                    { length: maxChildrenOptions + 1 },
                                    (_, i) => ({
                                      label: String(i),
                                      value: i,
                                    })
                                  )}
                                />
                              </Col>

                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Em bé (0-5 tuổi)
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentBabies}
                                  onChange={(value) => {
                                    const newAgesList = [...childrenAgesList];
                                    newAgesList[roomIndex] =
                                      Array(value).fill(2);
                                    setChildrenAgesList(newAgesList);
                                  }}
                                  options={Array.from(
                                    { length: maxBabies + 1 },
                                    (_, i) => ({
                                      label: String(i),
                                      value: i,
                                    })
                                  )}
                                />
                              </Col>
                            </Row>
                          </div>
                        );
                      }
                    )}
                </div>
              </div>
            </Panel>
          </Collapse>
        </div>
        {/* Modal Tiện nghi */}
        <Modal
          title={null}
          open={amenitiesModalOpen}
          onCancel={() => setAmenitiesModalOpen(false)}
          footer={null}
          width={900}
          closeIcon={
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "normal",
                cursor: "pointer",
              }}
            >
              ×
            </div>
          }
        >
          <Row gutter={24}>
            {/* Cột trái: Ảnh với slider */}
            <Col span={10}>
              <div style={{ position: "relative" }}>
                {roomType.images && roomType.images.length > 0 ? (
                  <>
                    <img
                      src={
                        roomType.images[modalImageIndex].startsWith("http")
                          ? roomType.images[modalImageIndex]
                          : `http://localhost:5000${roomType.images[modalImageIndex]}`
                      }
                      alt={roomType.name}
                      style={{
                        width: "100%",
                        height: "320px",
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                    {/* Nút prev */}
                    {roomType.images.length > 1 && (
                      <>
                        <div
                          onClick={() =>
                            setModalImageIndex((prev) =>
                              prev === 0
                                ? roomType.images!.length - 1
                                : prev - 1
                            )
                          }
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            background: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <LeftOutlined style={{ fontSize: "16px" }} />
                        </div>
                        {/* Nút next */}
                        <div
                          onClick={() =>
                            setModalImageIndex((prev) =>
                              prev === roomType.images!.length - 1
                                ? 0
                                : prev + 1
                            )
                          }
                          style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            background: "rgba(255, 255, 255, 0.9)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <RightOutlined style={{ fontSize: "16px" }} />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "320px",
                      background: "#f0f0f0",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Cột phải: Thông tin */}
            <Col span={14}>
              <div>
                {/* Tên phòng */}
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#333",
                  }}
                >
                  {roomType.name}
                </h2>

                {/* Diện tích và hướng nhìn */}
                <div
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "16px",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                  }}
                >
                  <span>
                    <ExpandOutlined
                      style={{ fontSize: "13px", marginRight: 4 }}
                    />
                    {roomType.room_size || 30} m²
                  </span>
                  {roomType.view_direction && (
                    <span>
                      <span style={{ marginRight: 4 }}>
                        <FundViewOutlined />
                      </span>
                      {roomType.view_direction}
                    </span>
                  )}
                </div>

                {/* Mô tả */}
                {roomType.description && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      lineHeight: "1.6",
                      marginBottom: "24px",
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        roomType.description ||
                        "Căn phòng này có máy sấy, khu vực tiếp khách và máy lạnh.",
                    }}
                  />
                )}

                {/* Tiện ích trong phòng */}
                <div>
                  <h3
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      marginBottom: "12px",
                      color: "#333",
                    }}
                  >
                    Tiện ích trong phòng:
                  </h3>
                  {(() => {
                    const allAmenities = [
                      ...(roomType.free_amenities || []),
                      ...(roomType.paid_amenities || []),
                    ];

                    // Chuẩn hóa icon tiện nghi cho đồng bộ
                    const getAmenityIcon = (name: string) => {
                      const lowerName = name.toLowerCase();
                      if (
                        lowerName.includes("wifi") ||
                        lowerName.includes("tốc độ")
                      )
                        return (
                          <WifiOutlined
                            style={{ fontSize: "18px", color: "#1890ff" }}
                          />
                        );
                      if (
                        lowerName.includes("nước") ||
                        lowerName.includes("suối")
                      )
                        return (
                          <CoffeeOutlined
                            style={{ fontSize: "18px", color: "#52c41a" }}
                          />
                        );
                      if (
                        lowerName.includes("bàn chải") ||
                        lowerName.includes("đánh răng") ||
                        lowerName.includes("kem")
                      )
                        return (
                          <SnippetsOutlined
                            style={{ fontSize: "18px", color: "#faad14" }}
                          />
                        );
                      if (
                        lowerName.includes("dầu") ||
                        lowerName.includes("gội") ||
                        lowerName.includes("sữa tắm")
                      )
                        return (
                          <HolderOutlined
                            style={{ fontSize: "18px", color: "#faad14" }}
                          />
                        );
                      if (lowerName.includes("khăn"))
                        return (
                          <HomeOutlined
                            style={{ fontSize: "18px", color: "#1890ff" }}
                          />
                        );
                      if (lowerName.includes("dép"))
                        return (
                          <HomeOutlined
                            style={{ fontSize: "18px", color: "#faad14" }}
                          />
                        );
                      if (
                        lowerName.includes("minibar") ||
                        lowerName.includes("đồ uống") ||
                        lowerName.includes("gas")
                      )
                        return (
                          <CoffeeOutlined
                            style={{ fontSize: "18px", color: "#faad14" }}
                          />
                        );
                      if (
                        lowerName.includes("room service") ||
                        lowerName.includes("24/7")
                      )
                        return (
                          <PhoneOutlined
                            style={{ fontSize: "18px", color: "#1890ff" }}
                          />
                        );
                      if (
                        lowerName.includes("giặt") ||
                        lowerName.includes("là")
                      )
                        return (
                          <HomeOutlined
                            style={{ fontSize: "18px", color: "#52c41a" }}
                          />
                        );
                      if (
                        lowerName.includes("snack") ||
                        lowerName.includes("ăn nhẹ")
                      )
                        return (
                          <CoffeeOutlined
                            style={{ fontSize: "18px", color: "#faad14" }}
                          />
                        );
                      return (
                        <HomeOutlined
                          style={{ fontSize: "18px", color: "#999" }}
                        />
                      );
                    };

                    return allAmenities.length > 0 ? (
                      <Row gutter={[16, 12]}>
                        {allAmenities.map((amenity: string, idx: number) => (
                          <Col span={12} key={idx}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div style={{ fontSize: "18px", color: "#666" }}>
                                {getAmenityIcon(amenity)}
                              </div>
                              <span style={{ fontSize: "13px", color: "#333" }}>
                                {amenity}
                              </span>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <div style={{ color: "#999", fontSize: "13px" }}>
                        Không có thông tin tiện nghi
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Col>
          </Row>
        </Modal>{" "}
        {/* Modal Chính sách */}
        <Modal
          title={roomType.name.toUpperCase()}
          open={policyModalOpen}
          onCancel={() => setPolicyModalOpen(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setPolicyModalOpen(false)}
              style={{
                background: "#f5a623",
                borderColor: "#f5a623",
                fontWeight: "600",
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
            {/* Tiện nghi miễn phí */}
            {roomType.free_amenities && roomType.free_amenities.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "16px",
                    fontSize: "16px",
                    color: "#52c41a",
                  }}
                >
                  ✓ Tiện nghi miễn phí
                </div>
                <Row gutter={[16, 16]}>
                  {roomType.free_amenities.map(
                    (amenity: string, idx: number) => {
                      const getAmenityIcon = (name: string) => {
                        const lowerName = name.toLowerCase();
                        if (
                          lowerName.includes("wifi") ||
                          lowerName.includes("internet") ||
                          lowerName.includes("tốc độ")
                        )
                          return <WifiOutlined style={{ fontSize: "18px" }} />;
                        if (
                          lowerName.includes("nước") ||
                          lowerName.includes("suối") ||
                          lowerName.includes("chai")
                        )
                          return (
                            <CoffeeOutlined style={{ fontSize: "18px" }} />
                          );
                        if (
                          lowerName.includes("bàn chải") ||
                          lowerName.includes("đánh răng") ||
                          lowerName.includes("kem")
                        )
                          return (
                            <SnippetsOutlined style={{ fontSize: "18px" }} />
                          );
                        if (
                          lowerName.includes("dầu") ||
                          lowerName.includes("gội") ||
                          lowerName.includes("sữa tắm")
                        )
                          return (
                            <HolderOutlined style={{ fontSize: "18px" }} />
                          );
                        if (
                          lowerName.includes("khăn") ||
                          lowerName.includes("tắm") ||
                          lowerName.includes("mặt")
                        )
                          return <HomeOutlined style={{ fontSize: "18px" }} />;
                        if (lowerName.includes("dép"))
                          return <HomeOutlined style={{ fontSize: "18px" }} />;
                        return <HomeOutlined style={{ fontSize: "18px" }} />;
                      };

                      return (
                        <Col span={12} key={`free-${idx}`}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 0",
                            }}
                          >
                            <div
                              style={{
                                color: "#52c41a",
                                width: "24px",
                                textAlign: "center",
                              }}
                            >
                              {getAmenityIcon(amenity)}
                            </div>
                            <span style={{ color: "#333", fontSize: "14px" }}>
                              {amenity}
                            </span>
                          </div>
                        </Col>
                      );
                    }
                  )}
                </Row>
              </div>
            )}

            {/* Tiện nghi tính phí */}
            {roomType.paid_amenities && roomType.paid_amenities.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontWeight: "600",
                    marginBottom: "16px",
                    fontSize: "16px",
                    color: "#f5a623",
                  }}
                >
                  💰 Tiện nghi tính phí
                </div>
                <Row gutter={[16, 16]}>
                  {roomType.paid_amenities.map(
                    (amenity: string, idx: number) => {
                      const getAmenityIcon = (name: string) => {
                        const lowerName = name.toLowerCase();
                        if (
                          lowerName.includes("minibar") ||
                          lowerName.includes("đồ uống") ||
                          lowerName.includes("gas")
                        )
                          return (
                            <CoffeeOutlined style={{ fontSize: "18px" }} />
                          );
                        if (
                          lowerName.includes("room service") ||
                          lowerName.includes("24/7")
                        )
                          return <PhoneOutlined style={{ fontSize: "18px" }} />;
                        if (
                          lowerName.includes("giặt") ||
                          lowerName.includes("là")
                        )
                          return <HomeOutlined style={{ fontSize: "18px" }} />;
                        if (
                          lowerName.includes("snack") ||
                          lowerName.includes("ăn nhẹ")
                        )
                          return (
                            <CoffeeOutlined style={{ fontSize: "18px" }} />
                          );
                        return <HomeOutlined style={{ fontSize: "18px" }} />;
                      };

                      return (
                        <Col span={12} key={`paid-${idx}`}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 0",
                            }}
                          >
                            <div
                              style={{
                                color: "#f5a623",
                                width: "24px",
                                textAlign: "center",
                              }}
                            >
                              {getAmenityIcon(amenity)}
                            </div>
                            <span style={{ color: "#333", fontSize: "14px" }}>
                              {amenity}
                            </span>
                          </div>
                        </Col>
                      );
                    }
                  )}
                </Row>
              </div>
            )}

            {/* Chính sách hoàn hủy */}
            {roomType.policies?.cancellation && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  Chính sách hoàn hủy
                </div>
                <div style={{ color: "#666" }}>
                  {typeof roomType.policies.cancellation === "string"
                    ? roomType.policies.cancellation
                    : "Nếu hủy, thay đổi hoặc không đến, khách sẽ trả toàn bộ giá trị tiền đặt phòng."}
                </div>
              </div>
            )}

            {/* Thanh toán */}
            {roomType.policies?.payment && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  Thanh toán
                </div>
                <div style={{ color: "#666" }}>
                  {typeof roomType.policies.payment === "string"
                    ? roomType.policies.payment
                    : "Thanh toán toàn bộ giá trị tiền đặt phòng."}
                </div>
              </div>
            )}

            {/* Nhận phòng */}
            <div style={{ marginBottom: "8px" }}>
              <strong>Nhận phòng:</strong>{" "}
              {roomType.policies?.checkin &&
              typeof roomType.policies.checkin === "string"
                ? roomType.policies.checkin
                : "15:00"}
            </div>

            {/* Trả phòng */}
            <div style={{ marginBottom: "16px" }}>
              <strong>Trả phòng:</strong>{" "}
              {roomType.policies?.checkout &&
              typeof roomType.policies.checkout === "string"
                ? roomType.policies.checkout
                : "12:00"}
            </div>

            {/* Phụ thu người lớn */}
            <div style={{ marginBottom: "8px" }}>
              <strong>Phụ thu người lớn:</strong>{" "}
              {roomType.extra_adult_fee
                ? `${new Intl.NumberFormat("vi-VN").format(Number(roomType.extra_adult_fee))} VND /đêm`
                : "Không có"}
            </div>

            {/* Phụ thu trẻ em */}
            <div style={{ marginBottom: "16px" }}>
              <strong>Phụ thu trẻ em:</strong>{" "}
              {roomType.extra_child_fee
                ? `${new Intl.NumberFormat("vi-VN").format(Number(roomType.extra_child_fee))} VND /đêm`
                : "Không có"}
            </div>

            {/* Chính sách khác */}
            {roomType.policies?.other_policies &&
              roomType.policies.other_policies.length > 0 && (
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    Chính sách khác
                  </div>
                  <div style={{ color: "#666" }}>
                    {roomType.policies.other_policies.map(
                      (policy: string, idx: number) => (
                        <div key={idx}>{policy}</div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </Modal>
      </>
    );
  }
);

export default RoomTypeCard;
