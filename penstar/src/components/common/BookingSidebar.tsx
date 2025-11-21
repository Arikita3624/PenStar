import { Card, Divider, Button, Empty } from "antd";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export interface BookingRoom {
  id: number;
  name: string;
  type_name: string;
  price: number;
  num_adults: number;
  num_children: number;
}

export interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  rooms: BookingRoom[];
  promoCode?: string;
  onCheckout: () => void;
  loading: boolean;
}

// ...existing code...

const BookingSidebar: React.FC<BookingSidebarProps> = ({
  checkIn,
  checkOut,
  rooms,
  // promoCode,
  onCheckout,
  loading,
}) => {
  const nights = dayjs(checkOut).diff(dayjs(checkIn), "day");
  const totalPrice = rooms.reduce((sum, room) => sum + room.price * nights, 0);
  const totalAdults = rooms.reduce((sum, room) => sum + room.num_adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.num_children, 0);

  return (
    <Card
      className="sticky top-0"
      style={{
        borderRadius: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        border: "none",
        borderTop: "3px solid #0a4f86",
        boxShadow: "0 12px 48px rgba(10, 79, 134, 0.15)",
        background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
        overflow: "hidden",
      }}
    >
      <div>
        <div className="mb-4">
          <h3
            className="text-xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Thông tin đặt phòng
          </h3>
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <CalendarOutlined className="text-[#0a4f86]" />
            <span className="text-sm">
              {dayjs(checkIn).format("DD/MM/YYYY")} -{" "}
              {dayjs(checkOut).format("DD/MM/YYYY")}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            ({nights} {nights === 1 ? "đêm" : "ngày"})
          </div>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        {/* Danh sách phòng - Group by type */}
        {rooms.length === 0 ? (
          <Empty
            description="Chưa chọn phòng nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ margin: "20px 0" }}
          />
        ) : (
          <div className="space-y-3 mb-4">
            {/* Group rooms by type_name */}
            {(() => {
              const typeGroups: Record<string, BookingRoom[]> = {};
              rooms.forEach((room) => {
                if (!typeGroups[room.type_name])
                  typeGroups[room.type_name] = [];
                typeGroups[room.type_name].push(room);
              });
              const typeNames = Object.keys(typeGroups);
              if (typeNames.length > 1) {
                return typeNames.map((type, idx) => (
                  <div key={type}>
                    <div
                      className="font-bold text-[#0a4f86] text-base mb-2"
                      style={{ marginTop: idx > 0 ? 16 : 0 }}
                    >
                      {`${type} (${typeGroups[type].length} phòng)`}
                    </div>
                    {typeGroups[type].map((room, index) => (
                      <div
                        key={`${room.id}-${index}`}
                        className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 relative border border-blue-100"
                        style={{
                          boxShadow: "0 2px 8px rgba(10, 79, 134, 0.08)",
                          borderRadius: 0,
                        }}
                      >
                        <div className="pr-6">
                          <div className="font-semibold text-gray-800 mb-1">
                            Phòng {index + 1}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <UserOutlined />
                            <span>
                              {room.num_adults} Người lớn
                              {room.num_children > 0 &&
                                ` - ${room.num_children} Trẻ em`}
                            </span>
                          </div>
                          <div className="font-bold text-[#0a4f86] text-base">
                            {room.price.toLocaleString()} VNĐ / đêm
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              } else {
                return typeGroups[typeNames[0]].map((room, index) => (
                  <div
                    key={`${room.id}-${index}`}
                    className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 relative border border-blue-100"
                    style={{
                      boxShadow: "0 2px 8px rgba(10, 79, 134, 0.08)",
                      borderRadius: 0,
                    }}
                  >
                    <div className="pr-6">
                      <div className="font-semibold text-gray-800 mb-1">
                        Phòng {index + 1} ({room.type_name})
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <UserOutlined />
                        <span>
                          {room.num_adults} Người lớn
                          {room.num_children > 0 &&
                            ` - ${room.num_children} Trẻ em`}
                        </span>
                      </div>
                      <div className="font-bold text-[#0a4f86] text-base">
                        {room.price.toLocaleString()} VNĐ / đêm
                      </div>
                    </div>
                  </div>
                ));
              }
            })()}
          </div>
        )}
        {rooms.length > 0 && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng khách:</span>
                <span className="font-semibold">
                  {totalAdults + totalChildren} người ({totalAdults} người lớn,{" "}
                  {totalChildren} trẻ em)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số phòng:</span>
                <span className="font-semibold">{rooms.length} phòng</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200">
                <span className="text-lg font-bold text-gray-800">
                  Tổng cộng:
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {totalPrice.toLocaleString()} VNĐ
                </span>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              block
              onClick={onCheckout}
              loading={loading}
              disabled={rooms.length === 0}
              className="font-bold text-lg"
              style={{
                background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                borderColor: "transparent",
                height: "56px",
                boxShadow: "0 6px 20px rgba(10, 79, 134, 0.35)",
                fontSize: "16px",
                letterSpacing: "1px",
                borderRadius: 0,
              }}
            >
              ĐẶT NGAY
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default BookingSidebar;
