import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Input, Popconfirm, Table, message, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { DiscountCode } from "@/services/discountCodesApi";
import {
  getDiscountCodes,
  deleteDiscountCode,
} from "@/services/discountCodesApi";
import { format } from "date-fns";

const DiscountCodesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: discountCodes = [], isLoading } = useQuery({
    queryKey: ["discountCodes"],
    queryFn: getDiscountCodes,
  });

  const filteredCodes = discountCodes.filter((code: DiscountCode) => {
    const q = String(searchTerm ?? "").trim().toLowerCase();
    if (!q) return true;
    return (
      String(code.code ?? "").toLowerCase().includes(q) ||
      String(code.description ?? "").toLowerCase().includes(q)
    );
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteDiscountCode(id),
    onSuccess: () => {
      message.success("Xóa mã giảm giá thành công");
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
    },
    onError: () => message.error("Không thể xóa mã giảm giá"),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const columns: ColumnsType<DiscountCode> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (code: string) => (
        <Tag color="blue" style={{ fontSize: 14, fontWeight: "bold" }}>
          {code}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Loại giảm giá",
      key: "discount_type",
      render: (_v, record) => (
        <Tag color={record.discount_type === "percentage" ? "green" : "orange"}>
          {record.discount_type === "percentage" ? "Phần trăm" : "Số tiền cố định"}
        </Tag>
      ),
    },
    {
      title: "Giá trị",
      key: "discount_value",
      render: (_v, record) => {
        if (record.discount_type === "percentage") {
          return `${record.discount_value}%`;
        }
        return formatPrice(record.discount_value);
      },
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "min_order_amount",
      key: "min_order_amount",
      render: (amount: number) => (amount ? formatPrice(amount) : "—"),
    },
    {
      title: "Giảm tối đa",
      dataIndex: "max_discount_amount",
      key: "max_discount_amount",
      render: (amount: number) => (amount ? formatPrice(amount) : "—"),
    },
    {
      title: "Sử dụng",
      key: "usage",
      render: (_v, record) => {
        if (record.usage_limit) {
          return `${record.used_count || 0}/${record.usage_limit}`;
        }
        return record.used_count || 0;
      },
    },
    {
      title: "Hiệu lực",
      key: "validity",
      render: (_v, record) => {
        const now = new Date();
        const validFrom = new Date(record.valid_from);
        const validUntil = new Date(record.valid_until);

        if (!record.is_active) {
          return <Tag color="red">Vô hiệu hóa</Tag>;
        }

        if (now < validFrom) {
          return <Tag color="blue">Chưa có hiệu lực</Tag>;
        }

        if (now > validUntil) {
          return <Tag color="default">Hết hạn</Tag>;
        }

        return <Tag color="green">Đang hoạt động</Tag>;
      },
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_v, record) => (
        <div style={{ fontSize: 12 }}>
          <div>
            Từ: {format(new Date(record.valid_from), "dd/MM/yyyy HH:mm")}
          </div>
          <div>
            Đến: {format(new Date(record.valid_until), "dd/MM/yyyy HH:mm")}
          </div>
        </div>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/discount-codes/${record.id}/edit`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            description="Bạn có chắc muốn xóa mã giảm giá này?"
            onConfirm={() => deleteMut.mutate(record.id!)}
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
        <h1 className="text-2xl font-bold">MÃ GIẢM GIÁ</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm kiếm mã giảm giá..."
            style={{ width: 300 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/discount-codes/add")}
          >
            Thêm mã giảm giá
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredCodes}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredCodes.length,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </Card>
    </div>
  );
};

export default DiscountCodesPage;

