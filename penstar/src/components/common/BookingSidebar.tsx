import { Card, Divider, Button, Tag, Empty } from "antd";
import {
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export interface BookingRoom {
  id: number;
  name: string;
  type_name: string;
  price: number;
  num_adults: number;
  num_children: number;
  onRemove?: () => void;
}

interface BookingSidebarProps {
  checkIn: string;
  checkOut: string;
  rooms: BookingRoom[];
  promoCode?: string;
  onCheckout: () => void;
  loading?: boolean;
}

const BookingSidebar: React.FC<BookingSidebarProps> = ({
  checkIn,
  checkOut,
  rooms,
  promoCode,
  onCheckout,
  loading,
}) => {
  const nights = dayjs(checkOut).diff(dayjs(checkIn), "day");
  const totalPrice = rooms.reduce((sum, room) => sum + room.price * nights, 0);
  const totalAdults = rooms.reduce((sum, room) => sum + room.num_adults, 0);
  const totalChildren = rooms.reduce((sum, room) => sum + room.num_children, 0);

  return (
    <Card
      className="sticky top-4 shadow-xl"
      style={{
        borderRadius: "12px",
        border: "2px solid #f0f0f0",
      }}
    >
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          📋 Thông tin đặt phòng
        </h3>

        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <CalendarOutlined />
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

      {/* Danh sách phòng */}
      {rooms.length === 0 ? (
        <Empty
          description="Chưa chọn phòng nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "20px 0" }}
        />
      ) : (
        <div className="space-y-3 mb-4">
          {rooms.map((room, index) => (
            <div
              key={`${room.id}-${index}`}
              className="bg-gray-50 p-3 rounded-lg relative"
            >
              {room.onRemove && (
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={room.onRemove}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                />
              )}

              <div className="pr-6">
                <div className="font-semibold text-gray-800 mb-1">
                  Phòng {index + 1}: {room.name}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {room.type_name}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <UserOutlined />
                  <span>
                    {room.num_adults} Người lớn
                    {room.num_children > 0 && ` - ${room.num_children} Trẻ em`}
                  </span>
                </div>

                <div className="font-bold text-blue-600">
                  {room.price.toLocaleString()} VNĐ / đêm
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promo Code */}
      {promoCode && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Mã khuyến mãi:</span>
            <Tag color="gold" className="font-semibold">
              {promoCode}
            </Tag>
          </div>
        </>
      )}

      {/* Tổng cộng */}
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
              background: "#fbbf24",
              borderColor: "#fbbf24",
              height: "50px",
            }}
          >
            ĐẶT NGAY
          </Button>
        </>
      )}
    </Card>
  );
};

export default BookingSidebar;
