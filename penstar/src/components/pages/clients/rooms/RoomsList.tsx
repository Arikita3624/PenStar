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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#0a4f86]">
          Danh sách phòng của khách sạn
        </h1>
        <p className="text-gray-600 mt-2">
          Khám phá các loại phòng phù hợp với kỳ nghỉ của bạn !
        </p>
      </div>
      {/* --- FILTER BAR --- */}
      <div className="mb-6 bg-white shadow-sm rounded-lg p-4 flex flex-wrap items-center gap-3">
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
            type="primary"
            onClick={() => {
              setSearch("");
              setTypeFilter(undefined);
              setFloorFilter(undefined);
              setStatusFilter(undefined);
              setPage(1);
            }}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      {/* --- LOADING --- */}
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
                    className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200"
                    cover={
                      <Link to={`/rooms/${room.id}`}>
                        <img
                          src={room.thumbnail || "/room-default.jpg"}
                          alt={room.name}
                          className="h-56 w-full object-cover cursor-pointer"
                        />
                      </Link>
                    }
                  >
                    {/* Tên phòng */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-[#0a4f86] line-clamp-1">
                        <Link
                          to={`/rooms/${room.id}`}
                          className="hover:underline"
                        >
                          {room.name || `Phòng ${room.id}`}
                        </Link>
                      </h3>
                      <Tag color={meta.color}>{meta.label}</Tag>
                    </div>

                    {/* Mô tả ngắn */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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
                    <div className="flex justify-between items-center mt-auto pt-2 border-t">
                      <div className="text-lg font-bold text-[#0a66a3]">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(room.price) || 0)}
                      </div>
                      {room.status === "available" ? (
                        <Link to={`/booking/staff-create?room_id=${room.id}`}>
                          <Button
                            type="primary"
                            size="middle"
                            className="ps-btn-primary"
                          >
                            Đặt phòng
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="primary"
                          size="middle"
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
  );
};

export default RoomsList;
