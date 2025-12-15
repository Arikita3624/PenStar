import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Table,
  message,
  Space,
  Avatar,
} from "antd";
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
      message.success("Xoá dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => message.error("Xoá dịch vụ thất bại"),
  });

  const columns: ColumnsType<Services> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Ảnh",
      key: "thumbnail",
      width: 80,
      render: (_v, record) =>
        record.thumbnail ? (
          <Avatar shape="square" size={50} src={record.thumbnail} />
        ) : null,
    },
    { title: "Tên dịch vụ", dataIndex: "name", key: "name" },
    {
      title: "Giá (VND)",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (p) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(p),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div
          className="max-w-[320px] whitespace-normal overflow-hidden"
          dangerouslySetInnerHTML={{ __html: String(text ?? "") }}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 180,
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/services/${record.id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xoá?"
            onConfirm={() => deleteMut.mutate(record.id)}
          >
            <Button type="primary" danger>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">DANH SÁCH DỊCH VỤ</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm theo tên dịch vụ"
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
            Thêm mới
          </Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredServices}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
            showQuickJumper: true,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>

      {/* modal removed; use separate pages for create/edit */}
    </div>
  );
};

export default ServicesPage;
