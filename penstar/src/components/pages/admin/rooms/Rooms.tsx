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
      messageApi.success("Room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => messageApi.error("Failed to delete room"),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

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
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumb) => <img src={thumb} width={50} alt="" />,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta: Record<string, { label: string; color: string }> = {
          available: { label: "Available", color: "green" },
          booked: { label: "Booked", color: "gold" },
          occupied: { label: "Occupied", color: "orange" },
          cleaning: { label: "Cleaning", color: "cyan" },
          unavailable: { label: "Unavailable", color: "red" },
        };
        const m = meta[String(status)] || {
          label: String(status).toUpperCase(),
          color: "default",
        };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: "Type",
      dataIndex: "type_name",
      key: "type_name",
      render: (type_name) => type_name || "N/A",
    },
    {
      title: "Floor",
      dataIndex: "floor_name",
      key: "floor_name",
      render: (floor_name) => floor_name || "N/A",
    },
    // Price column removed, now managed in room type
    {
      title: "Action",
      key: "action",
      render: (_, room) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/rooms/${(room as Room).id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete"
            description="Are you sure to delete this room?"
            onConfirm={() => deleteMut((room as Room).id)}
          >
            <Button type="primary" danger>
              Delete
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
        <h1 className="text-2xl font-bold">ROOM LIST</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Search by room name"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Filter by room type"
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
            placeholder="Filter by floor"
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
            Clear
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/rooms/add")}
          >
            Create
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
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            showQuickJumper: true,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </div>
    </div>
  );
};

export default Rooms;
