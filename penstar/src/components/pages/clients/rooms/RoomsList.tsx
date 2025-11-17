/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Tag,
  Pagination,
  Spin,
  Button,
  Card,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import type { Room } from "@/types/room";
import { Link } from "react-router-dom";

const RoomsList = () => {
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  const { data: floors = [] } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [floorFilter, setFloorFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const statusMeta: Record<string, { color: string; label: string }> = {
    available: { color: "green", label: "Sẵn sàng" },
    pending: { color: "orange", label: "Đã có người đặt" },
    booked: { color: "gold", label: "Đã đặt" },
    occupied: { color: "red", label: "Đang ở" },
    cleaning: { color: "purple", label: "Đang dọn" },
    maintenance: { color: "blue", label: "Bảo trì" },
    unavailable: { color: "volcano", label: "Tạm ngưng" },
  };

  const filtered = rooms?.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !String(r.name).toLowerCase().includes(q)) return false;
    if (typeFilter && String(r.type_id) !== typeFilter) return false;
    if (floorFilter && String(r.floor_id) !== floorFilter) return false;
    if (statusFilter && String(r.status) !== statusFilter) return false;
    return true;
  });

  const stripHtml = (html?: string) => {
    if (!html) return "";
    const tmp = html.replace(/<[^>]+>/g, "");
    return tmp.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (m) => {
      switch (m) {
        case "&nbsp;":
          return " ";
        case "&amp;":
          return "&";
        case "&lt;":
          return "<";
        case "&gt;":
          return ">";
        case "&quot;":
          return '"';
        case "&#39;":
          return "'";
        default:
          return m;
      }
    });
  };

  const truncate = (s: string, n = 120) =>
    s.length > n ? s.slice(0, n).trimEnd() + "..." : s;

  const paginated = filtered?.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div
        className="relative py-16 mb-8"
        style={{
          background: "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.2)" }}
          >
            Danh sách phòng của khách sạn
          </h1>
          <p
            className="text-white text-lg"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
          >
            Khám phá các loại phòng phù hợp với kỳ nghỉ của bạn !
          </p>
        </div>
      </div>
      {/* Close header section */}

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* --- FILTER BAR --- */}
        <div
          className="mb-8 bg-white p-6 relative overflow-hidden"
          style={{
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(10, 79, 134, 0.1)",
          }}
        >
          {/* Decorative top bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background:
                "linear-gradient(90deg, #0a4f86 0%, #0d6eab 50%, #0a4f86 100%)",
            }}
          />

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <Input.Search
                placeholder="Tìm phòng..."
                allowClear
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                size="middle"
              />
            </div>

            <Select
              placeholder="Loại phòng"
              allowClear
              size="middle"
              className="min-w-[150px]"
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              {Array.isArray(types) &&
                types.map((t: any) => (
                  <Select.Option key={t.id} value={String(t.id)}>
                    {t.name}
                  </Select.Option>
                ))}
            </Select>

            <Select
              placeholder="Tầng"
              allowClear
              size="middle"
              className="min-w-[120px]"
              onChange={(v) => {
                setFloorFilter(v);
                setPage(1);
              }}
            >
              {Array.isArray(floors) &&
                floors?.map((f: any) => (
                  <Select.Option key={f.id} value={String(f.id)}>
                    {f.name}
                  </Select.Option>
                ))}
            </Select>

            <Select
              placeholder="Trạng thái"
              allowClear
              size="middle"
              className="min-w-[150px]"
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              {Object.entries(statusMeta).map(([value, meta]) => (
                <Select.Option key={value} value={value}>
                  {meta.label}
                </Select.Option>
              ))}
            </Select>

            <div className="ml-auto">
              <Button
                type="default"
                size="large"
                onClick={() => {
                  setSearch("");
                  setTypeFilter(undefined);
                  setFloorFilter(undefined);
                  setStatusFilter(undefined);
                  setPage(1);
                }}
              >
                🔄 Đặt lại
              </Button>
            </div>
          </div>
          {/* Close flex wrapper */}
        </div>
        {/* Close filter bar */}

        {/* --- LOADING / CONTENT --- */}
        {isLoading ? (
          <div className="text-center py-12">
            <Spin />
          </div>
        ) : (
          <>
            {/* --- LIST ROOMS --- */}
            <Row gutter={[20, 20]}>
              {paginated?.map((room) => {
                const meta = statusMeta[room.status] || {
                  color: "default",
                  label: room.status,
                };

                return (
                  <Col xs={24} sm={12} lg={8} key={room.id}>
                    <Card
                      hoverable
                      className="overflow-hidden border-0 h-full flex flex-col"
                      style={{
                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease",
                      }}
                      styles={{
                        body: {
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                        },
                      }}
                      cover={
                        <Link
                          to={`/rooms/${room.id}`}
                          className="relative group"
                        >
                          <img
                            src={room.thumbnail || "/room-default.jpg"}
                            alt={room.name}
                            className="h-56 w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </Link>
                      }
                    >
                      {/* Tên phòng + Status */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-[#0a4f86] line-clamp-1 flex-1">
                          <Link
                            to={`/rooms/${room.id}`}
                            className="hover:text-[#0d6eab] transition-colors"
                          >
                            {room.name || `Phòng ${room.id}`}
                          </Link>
                        </h3>
                        <Tag
                          color={meta.color}
                          className="ml-2"
                          style={{ fontSize: "12px", padding: "2px 8px" }}
                        >
                          {meta.label}
                        </Tag>
                      </div>

                      {/* Mô tả ngắn */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                        {(() => {
                          const short = stripHtml(room.short_desc || "");
                          if (short) return truncate(short, 120);
                          const fromLong = stripHtml(room.long_desc || "");
                          return fromLong
                            ? truncate(fromLong, 120)
                            : "Không có mô tả";
                        })()}
                      </p>

                      {/* Giá + CTA */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="text-xl font-bold text-red-600">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(Number(room.price) || 0)}
                          <div className="text-xs text-gray-500 font-normal">
                            / đêm
                          </div>
                        </div>
                        {room.status === "available" ? (
                          <Link to={`/booking/staff-create?room_id=${room.id}`}>
                            <Button
                              type="primary"
                              size="large"
                              style={{
                                background:
                                  "linear-gradient(135deg, #0a4f86 0%, #0d6eab 100%)",
                                borderColor: "transparent",
                                fontWeight: "600",
                              }}
                            >
                              Đặt ngay
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            type="default"
                            size="large"
                            disabled
                            title="Phòng không khả dụng"
                          >
                            Không khả dụng
                          </Button>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* --- PAGINATION --- */}
            <div className="mt-10 flex justify-center">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filtered?.length}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomsList;
