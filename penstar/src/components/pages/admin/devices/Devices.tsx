import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Input, Popconfirm, Table, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { Device } from "@/services/devicesApi";
import { getDevices, deleteDevice } from "@/services/devicesApi";

const DevicesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });

  const filteredDevices = devices.filter((d: Device) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return (
      String(d.name ?? "").toLowerCase().includes(q) ||
      String(d.type ?? "").toLowerCase().includes(q)
    );
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDevice(id),
    onSuccess: () => {
      message.success("Thiết bị đã được xóa");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: () => message.error("Xóa thiết bị thất bại"),
  });

  const formatPrice = (price?: number) => {
    if (!price) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const columns: ColumnsType<Device> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "ID", dataIndex: "id", key: "id", width: 80 },
    { title: "Tên thiết bị", dataIndex: "name", key: "name" },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (type) => type || "—",
    },
    {
      title: "Phí bồi thường",
      dataIndex: "fee",
      key: "fee",
      render: (fee) => formatPrice(fee),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <div className="max-w-[300px] whitespace-normal overflow-hidden">
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/devices/${record.id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa thiết bị này?"
            onConfirm={() => deleteMut.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">THIẾT BỊ</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm theo tên hoặc loại"
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
            onClick={() => navigate("/admin/devices/new")}
          >
            Thêm mới
          </Button>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filteredDevices}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
            showQuickJumper: true,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>
    </div>
  );
};

export default DevicesPage;

