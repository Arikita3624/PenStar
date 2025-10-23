import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Input, Table, message, Popconfirm, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFloors, deleteFloor } from "@/services/floorsApi";
import { useNavigate } from "react-router-dom";
import type { Floors } from "@/types/floors";

const FloorList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: floors = [], isLoading } = useQuery<Floors[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const filteredFloors = floors.filter((f: Floors) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(f.name ?? "")
      .toLowerCase()
      .includes(q);
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteFloor(id),
    onSuccess: () => {
      message.success("Floor deleted");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
    onError: (err: unknown) => {
      const serverMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const msg = serverMsg || "Failed to delete floor";
      message.error(msg);
    },
  });

  const columns: ColumnsType<Floors> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div
          className="max-w-[520px] whitespace-normal overflow-hidden"
          dangerouslySetInnerHTML={{ __html: String(text ?? "") }}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/floors/${record.id}/edit`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete?"
            onConfirm={() => deleteMut.mutate(record.id)}
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
        <h1 className="text-2xl font-bold">FLOORS</h1>
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
            onClick={() => navigate("/admin/floors/new")}
          >
            New
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredFloors}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>

      {/* Add/Edit handled on separate pages */}
    </div>
  );
};

export default FloorList;
