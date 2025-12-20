/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { getAllStockLogs } from "@/services/equipmentStockLogsApi";
import { getMasterEquipmentById } from "@/services/masterEquipmentsApi";
import { getRoomID } from "@/services/roomsApi";
import { useQuery as useQueryRoomType } from "@tanstack/react-query";
import { instance } from "@/services/api";
import { Card, Table, Spin } from "antd";
import { useParams } from "react-router-dom";

// Master thiết bị columns
const masterColumns = [
  { title: "STT", dataIndex: "stt", key: "stt" },
  { title: "Tên", dataIndex: "name", key: "name" },
  { title: "Loại", dataIndex: "type", key: "type" },
  { title: "Giá nhập", dataIndex: "import_price", key: "import_price" },
  {
    title: "Giá đền bù",
    dataIndex: "compensation_price",
    key: "compensation_price",
  },
  { title: "Tồn kho", dataIndex: "total_stock", key: "total_stock" },
  { title: "Ngày tạo", dataIndex: "created_at", key: "created_at" },
];

// Room columns
const roomColumns = [
  { title: "STT", dataIndex: "stt", key: "stt" },
  { title: "Tên phòng", dataIndex: "name", key: "name" },
  { title: "Loại phòng", dataIndex: "roomTypeName", key: "roomTypeName" },
  { title: "Ngày tạo", dataIndex: "created_at", key: "created_at" },
  {
    title: "Ảnh đại diện",
    dataIndex: "thumbnail",
    key: "thumbnail",
    render: (value: string) =>
      value && value.match(/\.(jpg|jpeg|png|gif)$/i) ? (
        <img
          src={value}
          alt="thumbnail"
          style={{ maxWidth: 80, maxHeight: 80 }}
        />
      ) : (
        value
      ),
  },
  { title: "Tầng", dataIndex: "floor_id", key: "floor_id" },
];

const renderMasterTable = (data: Record<string, any>) => (
  <Card title="Thông tin thiết bị master" style={{ marginBottom: 16 }}>
    <Table
      dataSource={data ? [{ ...data, stt: 1 }] : []}
      columns={masterColumns}
      pagination={false}
      size="small"
      rowKey={() => "row"}
    />
  </Card>
);

const renderRoomTable = (
  data: Record<string, any>,
  roomTypeName: string,
  stt: number
) => (
  <Card title="Thông tin phòng" style={{ marginBottom: 16 }}>
    <Table
      dataSource={
        data
          ? [
              {
                ...data,
                roomTypeName,
                stt,
              },
            ]
          : []
      }
      columns={roomColumns}
      pagination={false}
      size="small"
      rowKey={() => "row"}
    />
  </Card>
);

const EquipmentLogDetail = () => {
  const { id } = useParams();
  const { data = [] } = useQuery({
    queryKey: ["equipment-logs-all"],
    queryFn: getAllStockLogs,
  });
  const log = data.find((item: unknown) => {
    if (typeof item === "object" && item !== null && "id" in item) {
      return String((item as { id: unknown }).id) === String(id);
    }
    return false;
  });

  // Lấy thông tin thiết bị master
  const { data: masterEquipment, isLoading: loadingMaster } = useQuery({
    queryKey: ["master-equipment", log?.equipment_id],
    queryFn: () => getMasterEquipmentById(log?.equipment_id),
    enabled:
      !!log?.equipment_id &&
      ["create_master", "import", "create"].includes(log?.action),
  });

  // Nếu là thêm vào phòng thì lấy thêm thông tin phòng
  let roomId: number | null = null;
  if (log?.action === "create" && log?.note) {
    const match = log.note.match(/ID: (\d+)/);
    roomId = match ? Number(match[1]) : null;
  }
  const { data: room, isLoading: loadingRoom } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoomID(roomId!),
    enabled: !!roomId,
  });

  // Lấy danh sách loại phòng để map tên
  const { data: roomTypes = [] } = useQueryRoomType({
    queryKey: ["room-types-all"],
    queryFn: async () => {
      const res = await instance.get("/roomtypes");
      return res.data?.data ?? [];
    },
  });

  if (!log) return <Card>Không tìm thấy log!</Card>;

  return (
    <Card title={`Chi tiết log #${log.id}`} style={{ marginTop: 24 }}>
      <p>
        <b>Loại thao tác:</b> {log.action} <br />
        <b>Thời gian:</b> {log.created_at} <br />
        <b>Ghi chú:</b> {log.note}
      </p>
      <Spin spinning={loadingMaster || loadingRoom}>
        {["create_master", "import", "create"].includes(log.action) &&
        masterEquipment &&
        typeof masterEquipment === "object"
          ? renderMasterTable(masterEquipment as Record<string, any>)
          : null}
        {log.action === "create" && room && typeof room === "object"
          ? renderRoomTable(
              room as Record<string, any>,
              roomTypes.find((rt: any) => rt.id === room.type_id)?.name ||
                String(room.type_id),
              1
            )
          : null}
      </Spin>
    </Card>
  );
};

export default EquipmentLogDetail;
