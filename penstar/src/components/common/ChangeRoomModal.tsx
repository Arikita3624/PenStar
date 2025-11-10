import React, { useState } from "react";
import { Modal, Radio, Space, Typography, message, Spin } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchAvailableRooms } from "@/services/roomsApi";
import { changeRoom } from "@/services/bookingsApi";
import type { ChangeRoomModalProps } from "@/types/changeRoom";

const { Text } = Typography;

const ChangeRoomModal: React.FC<ChangeRoomModalProps> = ({
  visible,
  onClose,
  bookingId,
  bookingItemId,
  currentRoom,
  checkIn,
  checkOut,
  numAdults,
  numChildren,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch available rooms
  const { data: roomsResponse, isLoading } = useQuery({
    queryKey: ["availableRooms", checkIn, checkOut, numAdults, numChildren],
    queryFn: () =>
      searchAvailableRooms({
        check_in: checkIn,
        check_out: checkOut,
        num_adults: numAdults,
        num_children: numChildren,
      }),
    enabled: visible,
  });

  const availableRooms = roomsResponse?.data || [];
  // Filter out current room
  const otherRooms = availableRooms.filter((r) => r.id !== currentRoom.id);

  // Change room mutation
  const changeRoomMutation = useMutation({
    mutationFn: () =>
      changeRoom(bookingId, {
        booking_item_id: bookingItemId,
        new_room_id: selectedRoomId!,
      }),
    onSuccess: () => {
      message.success("Đổi phòng thành công!");
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      onClose();
    },
    onError: (error: Error) => {
      message.error(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Đổi phòng thất bại"
      );
    },
  });

  const handleConfirm = () => {
    if (!selectedRoomId) {
      message.warning("Vui lòng chọn phòng mới");
      return;
    }

    Modal.confirm({
      title: "Xác nhận đổi phòng",
      content: `Bạn có chắc muốn đổi sang phòng mới? ${
        calculatePriceDiff() > 0
          ? `Bạn sẽ phải thanh toán thêm ${formatPrice(calculatePriceDiff())}`
          : calculatePriceDiff() < 0
          ? `Bạn sẽ được hoàn ${formatPrice(Math.abs(calculatePriceDiff()))}`
          : "Không có chênh lệch giá"
      }`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => changeRoomMutation.mutate(),
    });
  };

  const calculatePriceDiff = () => {
    if (!selectedRoomId) return 0;
    const selectedRoom = otherRooms.find((r) => r.id === selectedRoomId);
    if (!selectedRoom) return 0;

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const newPrice = selectedRoom.price * nights;
    const currentPrice = currentRoom.price * nights;

    return newPrice - currentPrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Modal
      title="Đổi phòng"
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Xác nhận đổi phòng"
      cancelText="Hủy"
      confirmLoading={changeRoomMutation.isPending}
      width={600}
    >
      {/* Current Room */}
      <div
        style={{
          padding: "12px",
          background: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <Text type="secondary">Phòng hiện tại:</Text>
        <br />
        <Text strong>
          {currentRoom.name} - {formatPrice(currentRoom.price)}
        </Text>
      </div>

      {/* Available Rooms */}
      <Text strong>📋 Chọn phòng mới:</Text>
      <div style={{ marginTop: "12px", maxHeight: "400px", overflowY: "auto" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin />
          </div>
        ) : otherRooms.length === 0 ? (
          <Text type="secondary">Không có phòng khả dụng khác</Text>
        ) : (
          <Radio.Group
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {otherRooms.map((room) => {
                const nights = Math.ceil(
                  (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const newPrice = room.price * nights;
                const currentPrice = currentRoom.price * nights;
                const priceDiff = newPrice - currentPrice;

                return (
                  <Radio
                    key={room.id}
                    value={room.id}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <Text strong>{room.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Loại phòng: {room.type_id}
                      </Text>
                      <br />
                      <Text style={{ fontSize: "13px" }}>
                        {formatPrice(room.price)}/đêm
                      </Text>
                      <br />
                      {priceDiff === 0 ? (
                        <Text type="success" style={{ fontSize: "12px" }}>
                          ✓ Cùng giá
                        </Text>
                      ) : priceDiff > 0 ? (
                        <Text type="warning" style={{ fontSize: "12px" }}>
                          ↑ +{formatPrice(priceDiff)} (Trả thêm)
                        </Text>
                      ) : (
                        <Text type="success" style={{ fontSize: "12px" }}>
                          ↓ {formatPrice(priceDiff)} (Hoàn lại)
                        </Text>
                      )}
                    </div>
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        )}
      </div>

      {/* Price Summary */}
      {selectedRoomId && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "#e6f7ff",
            borderRadius: "8px",
          }}
        >
          <Text strong> Chênh lệch giá: </Text>
          {calculatePriceDiff() === 0 ? (
            <Text type="success">Không có chênh lệch</Text>
          ) : calculatePriceDiff() > 0 ? (
            <Text type="warning" strong>
              +{formatPrice(calculatePriceDiff())} (Cần thanh toán thêm)
            </Text>
          ) : (
            <Text type="success" strong>
              {formatPrice(calculatePriceDiff())} (Sẽ được hoàn lại)
            </Text>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ChangeRoomModal;
