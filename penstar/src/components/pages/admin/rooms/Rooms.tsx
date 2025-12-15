/* eslint-disable @typescript-eslint/no-explicit-any */
// services used: roomsApi wrapper functions
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Popconfirm, Table, Select, Input, message } from "antd";
import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Room } from "@/types/room";
import { getRooms, deleteRoom } from "@/services/roomsApi";
import { getFloors } from "@/services/floorsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Rooms = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [filterTypeId, setFilterTypeId] = useState<number | string | null>(
    null
  );
  const [filterFloorId, setFilterFloorId] = useState<number | string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const navigate = useNavigate();

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery<Room[]>({ queryKey: ["rooms"], queryFn: getRooms });

  type FloorShort = { id: number | string; name: string };
  const { data: floors = [] } = useQuery<FloorShort[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  type RoomTypeShort = { id: number | string; name: string };
  const { data: room_types = [] } = useQuery<RoomTypeShort[]>({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  const { mutate: deleteMut } = useMutation({
    mutationFn: async (id: number) => deleteRoom(id),
    onSuccess: () => {
      messageApi.success("Xóa phòng thành công");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => messageApi.error("Xóa phòng thất bại"),
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (isError) return <div>Lỗi</div>;

  const filteredRooms = rooms?.filter((r) => {
    if (filterTypeId && String(r.type_id) !== String(filterTypeId))
      return false;
    if (filterFloorId && String(r.floor_id) !== String(filterFloorId))
      return false;
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (q) {
      const name = String(
        (r as unknown as Record<string, unknown>).name ?? ""
      ).toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const columns: ColumnsType<Room> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Ảnh đại diện",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumb) => <img src={thumb} width={50} alt="" />,
    },
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta: Record<string, { label: string; color: string }> = {
          available: { label: "Còn trống", color: "green" },
          booked: { label: "Đã đặt", color: "gold" },
          occupied: { label: "Đang ở", color: "orange" },
          cleaning: { label: "Đang dọn", color: "cyan" },
          unavailable: { label: "Không khả dụng", color: "red" },
        };
        const m = meta[String(status)] || {
          label: String(status).toUpperCase(),
          color: "default",
        };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: "Loại phòng",
      dataIndex: "type_name",
      key: "type_name",
      render: (type_name) => type_name || "N/A",
    },
    {
      title: "Tầng",
      dataIndex: "floor_name",
      key: "floor_name",
      render: (floor_name) => floor_name || "N/A",
    },
    // Price column removed, now managed in room type
    {
      title: "Thao tác",
      key: "action",
      render: (_, room) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/rooms/${(room as Room).id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa phòng"
            description="Bạn có chắc chắn muốn xóa phòng này?"
            onConfirm={() => deleteMut((room as Room).id)}
          >
            <Button type="primary" danger>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">DANH SÁCH PHÒNG</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm theo tên phòng"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Lọc theo loại phòng"
            style={{ width: 200 }}
            value={filterTypeId ?? undefined}
            onChange={(val) => {
              setFilterTypeId(val ?? null);
              setCurrentPage(1);
            }}
          >
            {Array.isArray(room_types) &&
              room_types.map((t: RoomTypeShort) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
          </Select>
          <Select
            allowClear
            placeholder="Lọc theo tầng"
            style={{ width: 200 }}
            value={filterFloorId ?? undefined}
            onChange={(val) => {
              setFilterFloorId(val ?? null);
              setCurrentPage(1);
            }}
          >
            {Array.isArray(floors) &&
              floors.map((f: FloorShort) => (
                <Select.Option key={f.id} value={f.id}>
                  {f.name}
                </Select.Option>
              ))}
          </Select>
          <Button
            onClick={() => {
              setFilterTypeId(null);
              setFilterFloorId(null);
              setCurrentPage(1);
            }}
          >
            Xóa lọc
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/rooms/add")}
          >
            Thêm mới
          </Button>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredRooms ?? rooms}
          rowKey="id"
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
            showQuickJumper: true,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </div>
    </div>
  );
};

export default Rooms;
