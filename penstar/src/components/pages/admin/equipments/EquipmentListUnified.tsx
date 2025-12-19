/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Table, Select, Button, Popconfirm, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getMasterEquipments,
  deleteMasterEquipment,
} from "@/services/masterEquipmentsApi";
import { getRooms } from "@/services/roomsApi";
import { getRoomDevices } from "@/services/roomDevicesApi";

const EquipmentListUnified = () => {
  const [selectedRoom, setSelectedRoom] = useState<number | undefined>();
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });
  const { data: masterEquipments = [], refetch: refetchMasterEquipments } =
    useQuery({
      queryKey: ["master-equipments"],
      queryFn: getMasterEquipments,
    });
  // Xóa thiết bị master
  const handleDeleteMaster = async (id: number) => {
    try {
      await deleteMasterEquipment(id);
      message.success("Đã xóa thiết bị master");
      refetchMasterEquipments();
    } catch {
      message.error("Lỗi khi xóa thiết bị master");
    }
  };
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices", selectedRoom],
    queryFn: () =>
      selectedRoom
        ? getRoomDevices({ room_id: selectedRoom })
        : Promise.resolve([]),
    enabled: !!selectedRoom,
  });

  const navigate = useNavigate();
  // Đảm bảo dữ liệu masterEquipments có trường loss_price
  // Nếu backend trả về loss_price là string, ép kiểu về number
  const normalizedMasterEquipments = masterEquipments.map((item: any) => ({
    ...item,
    import_price:
      item.import_price !== undefined && item.import_price !== null
        ? Number(item.import_price)
        : undefined,
    loss_price:
      item.loss_price !== undefined && item.loss_price !== null
        ? Number(item.loss_price)
        : undefined,
  }));
  const dataSource = selectedRoom ? roomDevices : normalizedMasterEquipments;

  // Định nghĩa columns duy nhất ngoài return
  const columns = [
    {
      title: "Tên thiết bị",
      dataIndex: selectedRoom ? "device_name" : "name",
      key: "name",
    },
    {
      title: "Loại thiết bị",
      dataIndex: selectedRoom ? "device_type" : "type",
      key: "type",
    },
    // Chỉ hiển thị khi chưa lọc phòng
    !selectedRoom && {
      title: "Giá nhập",
      dataIndex: "import_price",
      key: "import_price",
      render: (v: number) => (v ? v.toLocaleString() + " ₫" : "-"),
    },
    !selectedRoom && {
      title: "Giá tổn thất",
      dataIndex: "compensation_price",
      key: "compensation_price",
      render: (v: number) =>
        v !== undefined && v !== null
          ? Number(v).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + " ₫"
          : "-",
    },
    selectedRoom
      ? { title: "Số lượng", dataIndex: "quantity", key: "quantity" }
      : {
          title: "Tổng số lượng",
          dataIndex: "total_stock",
          key: "total_stock",
        },
    selectedRoom && { title: "Ghi chú", dataIndex: "note", key: "note" },
    selectedRoom && {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 200,
      render: (_: any, record: any) => (
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
            minWidth: 180,
          }}
        >
          <Button
            size="small"
            style={{ minWidth: 90 }}
            onClick={() => navigate(`/admin/room-devices/${record.id}/edit`)}
          >
            Sửa tồn kho
          </Button>
          <Button
            size="small"
            style={{ minWidth: 90 }}
            onClick={() =>
              navigate(`/admin/room-devices/${record.id}/transfer`)
            }
          >
            Điều chuyển
          </Button>
        </div>
      ),
    },
    // Thao tác cho master (khi không lọc phòng)
    !selectedRoom && {
      title: "Thao tác",
      key: "action",
      align: "center" as const,
      width: 120,
      render: (_: any, record: any) => (
        <Popconfirm
          title="Xóa thiết bị master?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => handleDeleteMaster(record.id)}
        >
          <Button size="small" danger>
            Xóa
          </Button>
        </Popconfirm>
      ),
    },
  ].filter(Boolean) as any[];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">DANH SÁCH THIẾT BỊ</h2>
      <div className="mb-4 flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          <span>Lọc theo phòng:</span>
          <Select
            style={{ width: 220 }}
            showSearch
            placeholder="Chọn phòng"
            value={selectedRoom}
            onChange={setSelectedRoom}
            allowClear
            optionFilterProp="children"
          >
            {rooms.map((r: any) => (
              <Select.Option key={r.id} value={r.id}>
                {r.name}
              </Select.Option>
            ))}
          </Select>
          {selectedRoom && (
            <Button onClick={() => setSelectedRoom(undefined)}>Bỏ lọc</Button>
          )}
        </div>
        <div className="flex gap-2">
          {!selectedRoom ? (
            <>
              <Button
                type="primary"
                onClick={() => navigate("/admin/equipments/import")}
              >
                Nhập kho
              </Button>
              <Button onClick={() => navigate("/admin/equipments/create")}>
                Thêm thiết bị
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <Table
        dataSource={dataSource}
        rowKey={selectedRoom ? "id" : "id"}
        columns={columns}
        pagination={false}
      />
    </div>
  );
};

export default EquipmentListUnified;
