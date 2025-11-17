import React, { useState } from "react";
import {
  Card,
  Radio,
  Space,
  Typography,
  message,
  Spin,
  Button,
  Row,
  Col,
  Tag,
  Modal,
  Collapse,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { searchAvailableRooms } from "@/services/roomsApi";
import { changeRoom } from "@/services/bookingsApi";
import { requestChangeRoom } from "@/services/bookingsApi";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { LocationState } from "@/types/changeRoom";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const ChangeRoomPage: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const state = location.state as LocationState;

  // Xác định xem có nhiều phòng không
  const hasMultipleRooms = !!state?.items && state.items.length > 0;
  const roomItems = hasMultipleRooms
    ? state.items!
    : state?.currentRoom
    ? [
        {
          bookingItemId: state.bookingItemId!,
          currentRoom: state.currentRoom,
          checkIn: state.checkIn!,
          checkOut: state.checkOut!,
          numAdults: state.numAdults!,
          numChildren: state.numChildren!,
        },
      ]
    : [];

  // State để lưu phòng mới được chọn cho từng booking item
  const [selectedRooms, setSelectedRooms] = useState<Record<number, number>>(
    {}
  );

  if (roomItems.length === 0 || !bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <Text type="danger">Thông tin không hợp lệ</Text>
          <br />
          <Button type="primary" onClick={() => navigate("/my-bookings")}>
            Quay lại danh sách booking
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/bookings/success/${bookingId}`)}
            className="mb-4"
          >
            Quay lại
          </Button>
          <Title level={2}>Đổi phòng</Title>
          <Text type="secondary">
            Chọn phòng mới cùng loại để thay đổi. Bạn chỉ được đổi phòng 1 lần
            duy nhất.
          </Text>
          <div className="mt-2">
            <Tag color="blue">Tổng số phòng: {roomItems.length}</Tag>
          </div>
        </div>

        {/* Hiển thị tất cả phòng */}
        <Collapse accordion defaultActiveKey={["0"]}>
          {roomItems.map((roomItem, index) => {
            const selectedRoomIdForItem =
              selectedRooms[roomItem.bookingItemId] || null;

            return (
              <Panel
                header={
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      Phòng {index + 1}: {roomItem.currentRoom.name}
                    </span>
                    {selectedRoomIdForItem && (
                      <Tag color="green">Đã chọn phòng mới</Tag>
                    )}
                  </div>
                }
                key={index.toString()}
              >
                <RoomChangeSection
                  roomItem={roomItem}
                  bookingId={bookingId!}
                  selectedRoomId={selectedRoomIdForItem}
                  onSelectRoom={(roomId) => {
                    setSelectedRooms({
                      ...selectedRooms,
                      [roomItem.bookingItemId]: roomId,
                    });
                  }}
                  onConfirm={(newRoomId) => {
                    Modal.confirm({
                      title: "Xác nhận đổi phòng",
                      content: `Bạn có chắc muốn đổi phòng ${roomItem.currentRoom.name} sang phòng mới?`,
                      okText: "Xác nhận",
                      cancelText: "Hủy",
                      onOk: async () => {
                        try {
                          const resp = await changeRoom(Number(bookingId), {
                            booking_item_id: roomItem.bookingItemId,
                            new_room_id: newRoomId,
                          });

                          // resp: { success, message, data, requires_payment?, price_difference? }
                          if (resp && resp.requires_payment) {
                            // Show modal to pay the difference
                            Modal.confirm({
                              title: "Yêu cầu thanh toán chênh lệch",
                              content: (
                                <div>
                                  <p>
                                    Phải thanh toán thêm: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(resp.price_difference || 0)}</strong>
                                  </p>
                                  <p className="text-sm text-gray-500">Vui lòng thanh toán khoản chênh lệch để hoàn tất duyệt đổi phòng.</p>
                                </div>
                              ),
                              okText: "Thanh toán",
                              cancelText: "Đóng",
                              onOk: async () => {
                                try {
                                  const paymentModule = await import('@/services/paymentApi');
                                  const createPayment = paymentModule.createPayment;
                                  const result = await createPayment({ amount: resp.price_difference });
                                  const paymentUrl = result.paymentUrl;
                                  if (paymentUrl) {
                                    window.open(paymentUrl, '_blank');
                                  } else {
                                    message.error('Không tạo được đường dẫn thanh toán');
                                  }
                                } catch (err) {
                                  console.error('Payment error:', err);
                                  message.error('Lỗi tạo thanh toán');
                                }
                              },
                            });
                          } else {
                            message.success("Đổi phòng thành công!");
                            queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
                            queryClient.invalidateQueries({ queryKey: ["bookings"] });
                            navigate(`/bookings/success/${bookingId}`);
                          }
                        } catch (err) {
                          console.error(err);
                          message.error("Đổi phòng thất bại");
                        }
                      },
                    });
                  }}
                />
                {/* Request change button (send a request to staff) */}
                <div style={{ marginTop: 12 }}>
                  <Button
                    onClick={() => {
                      Modal.confirm({
                        title: "Gửi yêu cầu đổi phòng",
                        content: (
                          <div>
                            <p>Bạn muốn gửi yêu cầu đổi phòng này tới lễ tân?</p>
                            <p className="text-sm text-gray-500">Lễ tân sẽ xét và liên hệ bạn.</p>
                          </div>
                        ),
                        okText: "Gửi yêu cầu",
                        cancelText: "Hủy",
                        onOk: async () => {
                          try {
                            await requestChangeRoom(Number(bookingId), {
                              booking_item_id: roomItem.bookingItemId,
                              requested_room_id: selectedRoomIdForItem || null,
                              reason: "Khách yêu cầu đổi phòng (từ UI)",
                            });
                            message.success("Yêu cầu đã được gửi. Lễ tân sẽ liên hệ.");
                          } catch (err) {
                            console.error(err);
                            message.error("Không thể gửi yêu cầu đổi phòng");
                          }
                        },
                      });
                    }}
                  >
                    Gửi yêu cầu đổi phòng
                  </Button>
                </div>
              </Panel>
            );
          })}
        </Collapse>
      </div>
    </div>
  );
};

// Component con để xử lý từng phòng
const RoomChangeSection: React.FC<{
  roomItem: {
    bookingItemId: number;
    currentRoom: { id: number; name: string; price: number; type_id: number };
    checkIn: string;
    checkOut: string;
    numAdults: number;
    numChildren: number;
  };
  bookingId: string;
  selectedRoomId: number | null;
  onSelectRoom: (roomId: number) => void;
  onConfirm: (roomId: number) => void;
}> = ({ roomItem, selectedRoomId, onSelectRoom, onConfirm }) => {
  const { data: roomsResponse, isLoading } = useQuery({
    queryKey: [
      "availableRooms",
      roomItem.checkIn,
      roomItem.checkOut,
      roomItem.numAdults,
      roomItem.numChildren,
      roomItem.currentRoom.type_id,
    ],
    queryFn: () =>
      searchAvailableRooms({
        check_in: roomItem.checkIn,
        check_out: roomItem.checkOut,
        num_adults: roomItem.numAdults,
        num_children: roomItem.numChildren,
        room_type_id: roomItem.currentRoom.type_id,
      }),
  });

  // If no rooms returned, fetch reason why
  const { data: reasonData, isFetching: reasonLoading } = useQuery({
    queryKey: [
      "availabilityReason",
      roomItem.checkIn,
      roomItem.checkOut,
      roomItem.currentRoom.type_id,
    ],
    enabled: !!roomItem.checkIn && !!roomItem.checkOut && !!roomItem.currentRoom.type_id && (roomsResponse?.data || []).length === 0,
    queryFn: () =>
      (async () => {
        const resp = await (await import("@/services/roomsApi")).getAvailabilityReason({
          check_in: roomItem.checkIn,
          check_out: roomItem.checkOut,
          room_type_id: roomItem.currentRoom.type_id,
          num_adults: roomItem.numAdults,
          num_children: roomItem.numChildren,
        });
        return resp;
      })(),
  });

  const availableRooms = roomsResponse?.data || [];
  const otherRooms = availableRooms.filter(
    (r) => r.id !== roomItem.currentRoom.id
  );

  const calculateNights = () => {
    return Math.ceil(
      (new Date(roomItem.checkOut).getTime() -
        new Date(roomItem.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const calculatePriceDiff = () => {
    if (!selectedRoomId) return 0;
    const selectedRoom = otherRooms.find((r) => r.id === selectedRoomId);
    if (!selectedRoom) return 0;

    const nights = calculateNights();
    const newPrice = selectedRoom.price * nights;
    const currentPrice = roomItem.currentRoom.price * nights;

    return newPrice - currentPrice;
  };

  return (
    <Row gutter={16}>
      {/* Left: Current Room Info */}
      <Col xs={24} lg={8}>
        <Card title="📍 Phòng hiện tại" className="mb-4">
          <div className="space-y-3">
            <div>
              <Text type="secondary" className="block mb-1">
                Tên phòng:
              </Text>
              <Text strong className="text-lg">
                {roomItem.currentRoom.name}
              </Text>
            </div>
            <div>
              <Text type="secondary" className="block mb-1">
                Giá phòng:
              </Text>
              <Text strong className="text-blue-600">
                {formatPrice(roomItem.currentRoom.price)}/đêm
              </Text>
            </div>
            <div>
              <Text type="secondary" className="block mb-1">
                Số đêm:
              </Text>
              <Text strong>{calculateNights()} đêm</Text>
            </div>
            <div>
              <Text type="secondary" className="block mb-1">
                Tổng tiền hiện tại:
              </Text>
              <Text strong className="text-lg text-green-600">
                {formatPrice(roomItem.currentRoom.price * calculateNights())}
              </Text>
            </div>

            {/* Price Summary */}
            {selectedRoomId && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Text strong className="block mb-2">
                  💰 Chênh lệch giá:
                </Text>
                {calculatePriceDiff() === 0 ? (
                  <Text type="success" className="text-lg">
                    Không có chênh lệch
                  </Text>
                ) : calculatePriceDiff() > 0 ? (
                  <Text type="warning" strong className="text-lg">
                    +{formatPrice(calculatePriceDiff())}
                    <br />
                    <span className="text-sm">(Cần thanh toán thêm)</span>
                  </Text>
                ) : (
                  <Text type="success" strong className="text-lg">
                    {formatPrice(calculatePriceDiff())}
                    <br />
                    <span className="text-sm">(Sẽ được hoàn lại)</span>
                  </Text>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <Button
              type="primary"
              size="large"
              block
              onClick={() => selectedRoomId && onConfirm(selectedRoomId)}
              disabled={!selectedRoomId}
              className="mt-4"
            >
              Xác nhận đổi phòng
            </Button>
          </div>
        </Card>
      </Col>

      {/* Right: Available Rooms */}
      <Col xs={24} lg={16}>
        <Card title="📋 Phòng cùng loại khả dụng">
          {isLoading ? (
            <div className="text-center py-20">
              <Spin size="large" tip="Đang tìm phòng..." />
            </div>
          ) : otherRooms.length === 0 ? (
            <div className="text-center py-20">
              {reasonLoading ? (
                <Spin tip="Đang kiểm tra lý do..." />
              ) : (
                <div>
                  {reasonData ? (
                    <div>
                      {reasonData.total === 0 && (
                        <Text type="secondary" className="text-lg">
                          Không có phòng cùng loại trong khách sạn.
                        </Text>
                      )}
                      {reasonData.total > 0 && reasonData.available_count === 0 && reasonData.blocked_by_conflict_count > 0 && (
                        <Text type="secondary" className="text-lg">
                          Không có phòng trống cho khoảng thời gian này. Các phòng cùng loại đang được đặt trong khoảng ngày bạn yêu cầu.
                        </Text>
                      )}
                      {reasonData.total > 0 && reasonData.available_count === 0 && reasonData.blocked_by_status_count > 0 && (
                        <Text type="secondary" className="text-lg">
                          Có phòng cùng loại nhưng hiện không ở trạng thái "Available" (ví dụ: đang occupied, pending hoặc maintenance).
                        </Text>
                      )}
                      {reasonData.total > 0 && reasonData.available_count === 0 && reasonData.blocked_by_conflict_count === 0 && reasonData.blocked_by_status_count === 0 && (
                        <Text type="secondary" className="text-lg">
                          Không có phòng phù hợp với yêu cầu (sức chứa / ngày). Vui lòng thử ngày khác hoặc liên hệ lễ tân.
                        </Text>
                      )}
                      <div className="mt-3 text-sm text-gray-500">
                        Tổng phòng cùng loại: {reasonData.total}. Phòng trống: {reasonData.available_count}.
                      </div>
                    </div>
                  ) : (
                    <Text type="secondary" className="text-lg">Không có phòng cùng loại khả dụng khác</Text>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Radio.Group
              value={selectedRoomId}
              onChange={(e) => onSelectRoom(e.target.value)}
              className="w-full"
            >
              <Space direction="vertical" className="w-full" size="middle">
                {otherRooms.map((room) => {
                  const nights = calculateNights();
                  const newPrice = room.price * nights;
                  const currentPrice = roomItem.currentRoom.price * nights;
                  const priceDiff = newPrice - currentPrice;

                  return (
                    <Radio key={room.id} value={room.id} className="w-full">
                      <Card
                        hoverable
                        className={`w-full ${
                          selectedRoomId === room.id
                            ? "border-2 border-blue-500 shadow-lg"
                            : ""
                        }`}
                        bodyStyle={{ padding: "16px" }}
                      >
                        <Row gutter={16} align="middle">
                          {/* Room Image */}
                          {room.thumbnail && (
                            <Col xs={24} sm={8}>
                              <img
                                src={room.thumbnail}
                                alt={room.name}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </Col>
                          )}

                          {/* Room Info */}
                          <Col xs={24} sm={16}>
                            <div className="space-y-2">
                              <div>
                                <Text strong className="text-lg">
                                  {room.name}
                                </Text>
                                <br />
                                <Text type="secondary" className="text-sm">
                                  Loại phòng: {room.type_id}
                                </Text>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Tag color="blue">
                                  Sức chứa: {room.capacity} người
                                </Tag>
                                <Tag color="green">Tầng: {room.floor_id}</Tag>
                              </div>

                              <div>
                                <Text className="block">
                                  Giá:{" "}
                                  <strong>{formatPrice(room.price)}</strong>
                                  /đêm
                                </Text>
                                <Text className="block">
                                  Tổng ({nights} đêm):{" "}
                                  <strong className="text-blue-600">
                                    {formatPrice(newPrice)}
                                  </strong>
                                </Text>
                              </div>

                              {/* Price Difference Tag */}
                              <div>
                                {priceDiff === 0 ? (
                                  <Tag color="success" className="text-sm">
                                    ✓ Cùng giá
                                  </Tag>
                                ) : priceDiff > 0 ? (
                                  <Tag color="warning" className="text-sm">
                                    ↑ +{formatPrice(priceDiff)} (Trả thêm)
                                  </Tag>
                                ) : (
                                  <Tag color="success" className="text-sm">
                                    ↓ {formatPrice(Math.abs(priceDiff))} (Hoàn
                                    lại)
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </Radio>
                  );
                })}
              </Space>
            </Radio.Group>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default ChangeRoomPage;
