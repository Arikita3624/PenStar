import React from "react";
import { Table, Space, Tag, Button, Input, Select, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBookings } from "@/services/bookingsApi";
import { getStayStatuses } from "@/services/stayStatusApi";
import type { BookingShort } from "@/types/bookings";
import type { StayStatus } from "@/types/stayStatus";

const BookingsList: React.FC = () => {
  const nav = useNavigate();
  const [search, setSearch] = React.useState("");
  const [paymentFilter, setPaymentFilter] = React.useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = React.useState<number | undefined>(
    undefined
  );
  const [current, setCurrent] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);

  const { data: bookings = [], isLoading } = useQuery<BookingShort[]>({
    queryKey: ["bookings"],
    queryFn: getBookings,
  });

  const { data: stayStatusesData } = useQuery<StayStatus[], Error>({
    queryKey: ["stay_statuses"],
    queryFn: getStayStatuses,
  });
  const stayStatuses: StayStatus[] = stayStatusesData ?? [];

  const columns: ColumnsType<BookingShort> = [
    {
      title: "STT",
      key: "index",
      render: (_text, _record, index) => index + 1,
      width: 70,
    },
    { title: "Khách hàng", dataIndex: "customer_name", key: "customer_name" },
    {
      title: "Tổng tiền",
      dataIndex: "total_price",
      key: "total_price",
      render: (v: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(Number(v) || 0),
    },
    {
      title: "Thanh toán",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (v: string, record: BookingShort) => {
        const vv = String(v || "").toLowerCase();
        const color =
          vv === "paid"
            ? "green"
            : vv === "pending"
              ? "gold"
              : vv === "failed"
                ? "red"
                : vv === "refunded"
                  ? "purple"
                  : vv === "cancelled"
                    ? "red"
                    : "default";
        return (
          <Space direction="vertical" size="small">
            <Tag color={color}>{String(v || "").toUpperCase()}</Tag>
            {record.is_refunded && (
              <Tag color="purple" style={{ fontSize: 11 }}>
                ✓ Hoàn tiền
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Hình thức",
      dataIndex: "booking_method",
      key: "booking_method",
      render: (method: string) => {
        const isOnline = method === "online";
        return (
          <Tag color={isOnline ? "blue" : "green"} style={{ fontSize: 11 }}>
            {isOnline ? "📱 Online" : "🏨 Trực tiếp"}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Trạng thái",
      dataIndex: "stay_status_id",
      key: "stay_status_id",
      render: (val: number) => {
        // Map theo database: 1=reserved, 2=checked_in, 3=checked_out, 4=canceled, 5=no_show, 6=pending
        const statusId = Number(val);
        let color = "default";
        let displayName = String(val);

        if (statusId === 6) {
          color = "gold";
          displayName = "Chờ xác nhận";
        } else if (statusId === 1) {
          color = "blue";
          displayName = "Đã xác nhận";
        } else if (statusId === 2) {
          color = "green";
          displayName = "Đã Check-in";
        } else if (statusId === 3) {
          color = "cyan";
          displayName = "Đã Checkout";
        } else if (statusId === 4) {
          color = "red";
          displayName = "Đã hủy";
        } else if (statusId === 5) {
          color = "purple";
          displayName = "Không đến";
        }

        return <Tag color={color}>{displayName}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: BookingShort) => (
        <Space>
          <Button onClick={() => nav(`/admin/bookings/${record.id}`)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  // apply client-side filters
  const filtered = bookings.filter((b) => {
    if (search) {
      const q = search.trim().toLowerCase();
      const inCustomer = String(b.customer_name || "")
        .toLowerCase()
        .includes(q);
      const inId = String(b.id || "")
        .toLowerCase()
        .includes(q);
      if (!inCustomer && !inId) return false;
    }
    if (paymentFilter && String(b.payment_status) !== paymentFilter)
      return false;
    if (statusFilter !== undefined && Number(b.stay_status_id) !== statusFilter)
      return false;
    return true;
  });

  const total = filtered.length;

  const pagedData = filtered.slice(
    (current - 1) * pageSize,
    current * pageSize
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách đặt phòng</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Tìm kiếm theo khách hàng hoặc mã đặt phòng"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrent(1);
            }}
            value={search}
          />
          <Select
            placeholder="Trạng thái thanh toán"
            allowClear
            style={{ width: 160 }}
            value={paymentFilter}
            onChange={(v) => {
              setPaymentFilter(v);
              setCurrent(1);
            }}
          >
            <Select.Option value="pending">Chờ thanh toán</Select.Option>
            <Select.Option value="paid">Đã thanh toán</Select.Option>
            <Select.Option value="failed">Thất bại</Select.Option>
          </Select>
          <Select
            placeholder="Trạng thái đặt phòng"
            allowClear
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setCurrent(1);
            }}
          >
            {stayStatuses.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={null}
            onClick={() => nav("/admin/bookings/create?method=offline")}
          >
            Tạo đặt phòng trực tiếp
          </Button>
          <Button
            onClick={() => {
              setSearch("");
              setPaymentFilter(undefined);
              setStatusFilter(undefined);
              setCurrent(1);
              setPageSize(5);
            }}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={pagedData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong tổng ${total}`,
            showQuickJumper: true,
            size: "default",
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size || 5);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default BookingsList;
