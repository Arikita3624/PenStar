import { Card, Button, Empty, Collapse } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { BookingSidebarProps, BookingRoom } from "@/types/bookings";

const BookingSidebar: React.FC<BookingSidebarProps> = ({
  checkIn,
  checkOut,
  rooms,
  // promoCode,
  onCheckout,
  onRemoveRoom,
  loading,
}) => {
  const nights = dayjs(checkOut).diff(dayjs(checkIn), "day");
  const totalPrice = rooms.reduce(
    (sum, room) =>
      sum +
      (Number(room.base_price || room.price) + Number(room.extra_fees || 0)) *
        nights,
    0
  );

  return (
    <Card
      className="sticky top-0 booking-sidebar-card"
      style={{
        borderRadius: 0,
        border: "1px solid #e5e7eb",
        boxShadow: "none",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* Hide empty elements and standalone zeros */
        .booking-sidebar-card .flex-1 > div:empty {
          display: none !important;
        }
        .booking-sidebar-card .ant-collapse-content-box > div:empty {
          display: none !important;
        }
      `}</style>
      <div>
        <div className="mb-4">
          <h3
            className="text-xl font-bold mb-3"
            style={{
              color: "#1f2937",
            }}
          >
            Thông tin đặt phòng
          </h3>
          <div className="text-sm text-gray-600 mb-1">
            {dayjs(checkIn).format("DD/MM/YYYY")} -{" "}
            {dayjs(checkOut).format("DD/MM/YYYY")} ({nights} ngày{" "}
            {nights === 1 ? "" : "1 "}đêm )
          </div>
        </div>
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
                return typeNames.map((type) => (
                  <Collapse
                    key={type}
                    defaultActiveKey={["1"]}
                    ghost
                    expandIconPosition="end"
                    items={[
                      {
                        key: "1",
                        label: (
                          <div className="font-bold text-gray-900 text-base">
                            Thông tin phòng
                          </div>
                        ),
                        children: (
                          <div>
                            <div className="font-semibold text-gray-800 text-sm mb-2">
                              Phòng: {typeGroups[type].length} {type}
                            </div>
                            {typeGroups[type].map((room, index) => {
                              // Tính toán index toàn cục bằng cách đếm các phòng trước đó
                              let roomGlobalIndex = 0;
                              for (let i = 0; i < rooms.length; i++) {
                                if (rooms[i] === room) {
                                  roomGlobalIndex = i;
                                  break;
                                }
                              }
                              return (
                                <div
                                  key={`${room.id}-${index}`}
                                  className="mb-3 pb-3 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-600 mb-1">
                                        {room.num_adults} Người lớn
                                        {room.num_children > 0 &&
                                          ` - ${room.num_children} Trẻ em`}
                                        {(room.num_babies || 0) > 0 &&
                                          ` - ${room.num_babies} Em bé`}
                                      </div>
                                      <div className="font-bold text-gray-900 text-base mb-1">
                                        {Math.round(
                                          Number(
                                            room.base_price || room.price
                                          ) + Number(room.extra_fees || 0)
                                        ).toLocaleString("vi-VN")}{" "}
                                        VNĐ / đêm
                                      </div>
                                      {(room.extra_adults_count ?? 0) > 0 ||
                                      (room.extra_children_count ?? 0) > 0 ? (
                                        <div className="text-xs text-gray-500">
                                          {(room.extra_adults_count ?? 0) >
                                            0 && (
                                            <div>
                                              Phụ thu người lớn:{" "}
                                              {(
                                                room.extra_adult_fees || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ /đêm
                                            </div>
                                          )}
                                          {(room.extra_children_count ?? 0) >
                                            0 && (
                                            <div>
                                              Phụ thu trẻ em:{" "}
                                              {(
                                                room.extra_child_fees || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ /đêm
                                            </div>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                    {onRemoveRoom && (
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={() =>
                                          onRemoveRoom(roomGlobalIndex)
                                        }
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        Hủy
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ),
                      },
                    ]}
                  />
                ));
              } else {
                return (
                  <Collapse
                    defaultActiveKey={["1"]}
                    ghost
                    expandIconPosition="end"
                    items={[
                      {
                        key: "1",
                        label: (
                          <div className="font-bold text-gray-900 text-base">
                            Thông tin phòng
                          </div>
                        ),
                        children: (
                          <div>
                            <div className="font-semibold text-gray-800 text-sm mb-2">
                              Phòng: {typeGroups[typeNames[0]].length}{" "}
                              {typeNames[0]}
                            </div>
                            {typeGroups[typeNames[0]].map((room, index) => {
                              // Tính toán index toàn cục
                              const roomGlobalIndex = rooms.indexOf(room);
                              return (
                                <div
                                  key={`${room.id}-${index}`}
                                  className="mb-3 pb-3 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-sm text-gray-600 mb-1">
                                        {room.num_adults} Người lớn
                                        {room.num_children > 0 &&
                                          ` - ${room.num_children} Trẻ em`}
                                        {(room.num_babies || 0) > 0 &&
                                          ` - ${room.num_babies} Em bé`}
                                      </div>
                                      <div className="font-bold text-gray-900 text-base mb-1">
                                        {Math.round(
                                          Number(
                                            room.base_price || room.price
                                          ) + Number(room.extra_fees || 0)
                                        ).toLocaleString("vi-VN")}{" "}
                                        VNĐ / đêm
                                      </div>
                                      {(room.extra_adults_count ?? 0) > 0 ||
                                      (room.extra_children_count ?? 0) > 0 ? (
                                        <div className="text-xs text-gray-500">
                                          {(room.extra_adults_count ?? 0) >
                                            0 && (
                                            <div>
                                              Phụ thu người lớn:{" "}
                                              {(
                                                room.extra_adult_fees || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ /đêm
                                            </div>
                                          )}
                                          {(room.extra_children_count ?? 0) >
                                            0 && (
                                            <div>
                                              Phụ thu trẻ em:{" "}
                                              {(
                                                room.extra_child_fees || 0
                                              ).toLocaleString()}{" "}
                                              VNĐ /đêm
                                            </div>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                    {onRemoveRoom && (
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={() =>
                                          onRemoveRoom(roomGlobalIndex)
                                        }
                                        className="text-gray-400 hover:text-red-500"
                                      >
                                        Hủy
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ),
                      },
                    ]}
                  />
                );
              }
            })()}
          </div>
        )}
        {rooms.length > 0 && (
          <>
            <div className="mb-4 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">
                  Tổng cộng:
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {Math.round(Number(totalPrice)).toLocaleString("vi-VN")} VNĐ
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
                background: "#f59e0b",
                borderColor: "#f59e0b",
                height: "56px",
                boxShadow: "none",
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
