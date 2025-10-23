import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Input, Popconfirm, Table, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Services } from "@/types/services";
import { getServices, deleteService } from "@/services/servicesApi";

const ServicesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const filteredServices = services.filter((s: Services) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(s.name ?? "")
      .toLowerCase()
      .includes(q);
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteService(id),
    onSuccess: () => {
      message.success("Service deleted");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => message.error("Failed to delete"),
  });

  const columns: ColumnsType<Services> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(p),
    },
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
            onClick={() => navigate(`/admin/services/${record.id}/edit`)}
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
        <h1 className="text-2xl font-bold">SERVICES</h1>
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
            onClick={() => navigate("/admin/services/new")}
          >
            New
          </Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>

      {/* modal removed; use separate pages for create/edit */}
    </div>
  );
};

export default ServicesPage;
