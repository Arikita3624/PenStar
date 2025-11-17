import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Space,
  Table,
  message,
  Popconfirm,
  Image,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomTypes, deleteRoomType } from "@/services/roomTypeApi";
import type { RoomType } from "@/types/roomtypes";

type RoomTypeItem = RoomType;

const RoomTypesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  const filteredTypes = types.filter((t: RoomTypeItem) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(t.name ?? "")
      .toLowerCase()
      .includes(q);
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteRoomType(id),
    onSuccess: () => {
      message.success("Room type deleted");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
    },
    onError: (err: unknown) => {
      const serverMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const msg = serverMsg || "Failed to delete";
      message.error(msg);
    },
  });

  const columns: ColumnsType<RoomTypeItem> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 60,
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 100,
      render: (thumbnail: string) => {
        const imageUrl = thumbnail
          ? thumbnail.startsWith("http")
            ? thumbnail
            : `http://localhost:5000${thumbnail}`
          : "https://via.placeholder.com/80x60?text=No+Image";
        return (
          <Image
            src={imageUrl}
            alt="Thumbnail"
            width={80}
            height={60}
            className="object-cover rounded"
            fallback="https://via.placeholder.com/80x60?text=No+Image"
          />
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div
          className="max-w-[400px] line-clamp-2 overflow-hidden"
          dangerouslySetInnerHTML={{ __html: String(text ?? "") }}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 180,
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/roomtypes/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this room type?"
            onConfirm={() => deleteMut.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ROOM TYPES</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Search by name"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/roomtypes/new")}
          >
            New
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTypes}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
            showQuickJumper: true,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>
    </div>
  );
};

export default RoomTypesPage;
