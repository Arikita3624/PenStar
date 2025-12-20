import { useQuery } from "@tanstack/react-query";
import { getAllStockLogs } from "@/services/equipmentStockLogsApi";
import { Card, Table, Tag } from "antd";

const columns = [
  { title: "ID", dataIndex: "id", key: "id", width: 60 },
  {
    title: "Thiết bị",
    dataIndex: "equipment_id",
    key: "equipment_id",
    width: 80,
  },
  {
    title: "Loại thao tác",
    dataIndex: "action",
    key: "action",
    render: (a: string) => {
      let viAction = "";
      switch (a) {
        case "create":
          viAction = "Thêm mới";
          break;
        case "update":
          viAction = "Cập nhật";
          break;
        case "delete":
          viAction = "Xóa";
          break;
        case "import":
          viAction = "Nhập kho";
          break;
        case "export":
          viAction = "Xuất kho";
          break;
        case "transfer":
          viAction = "Điều chuyển";
          break;
        case "create_master":
          viAction = "Thêm thiết bị master";
          break;
        default:
          viAction = a;
      }
      return (
        <Tag
          color={
            a === "create"
              ? "green"
              : a === "update"
                ? "blue"
                : a === "delete"
                  ? "red"
                  : a === "import"
                    ? "cyan"
                    : a === "export"
                      ? "orange"
                      : a === "transfer"
                        ? "purple"
                        : "default"
          }
        >
          {viAction}
        </Tag>
      );
    },
  },
  {
    title: "Thời gian",
    dataIndex: "created_at",
    key: "created_at",
    width: 180,
  },
  {
    title: "Chi tiết",
    key: "detail",
    align: "center" as const,
    render: (_: unknown, record: { id: number }) => (
      <a href={`/admin/equipments/log-detail/${record.id}`}>Xem chi tiết</a>
    ),
  },
  { title: "Ghi chú", dataIndex: "note", key: "note" },
];

const EquipmentLogHistory = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const equipmentId = searchParams.get("equipment_id");
  const { data = [], isLoading } = useQuery({
    queryKey: ["equipment-logs-all"],
    queryFn: getAllStockLogs,
  });
  const filteredData = equipmentId
    ? data.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (log: any) => String(log.equipment_id) === String(equipmentId)
      )
    : data;

  return (
    <Card
      title={
        equipmentId
          ? `Lịch sử thay đổi thiết bị #${equipmentId}`
          : "Lịch sử thay đổi thiết bị"
      }
      style={{ marginTop: 24 }}
    >
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={isLoading}
        rowKey="id"
        size="small"
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default EquipmentLogHistory;
