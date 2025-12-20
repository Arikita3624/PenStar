/* eslint-disable @typescript-eslint/no-explicit-any */

import { Form, Input, InputNumber, Button, Select, message } from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMasterEquipments } from "@/services/masterEquipmentsApi";
import { useQuery } from "@tanstack/react-query";
import { createRoomDevice, getRoomDevices } from "@/services/roomDevicesApi";

const RoomDeviceCreate = () => {
  const [form] = Form.useForm();
  const { data: masterEquipments = [], isLoading } = useQuery({
    queryKey: ["master-equipments"],
    queryFn: getMasterEquipments,
  });
  const [searchParams] = useSearchParams();
  const room_id = searchParams.get("room_id");
  // Lấy danh sách thiết bị đã có trong phòng
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices", room_id],
    queryFn: () =>
      getRoomDevices({ room_id: room_id ? Number(room_id) : undefined }),
    enabled: !!room_id,
  });
  // Lọc thiết bị master chưa có trong phòng
  const usedMasterIds = roomDevices.map((d: any) => d.master_equipment_id);
  const availableMasterEquipments = masterEquipments.filter(
    (eq: any) => !usedMasterIds.includes(eq.id)
  );
  const navigate = useNavigate();

  // ...existing code...

  const onFinish = async (values: any) => {
    try {
      await createRoomDevice({ ...values, room_id });
      message.success("Thêm thiết bị vào phòng thành công");
      navigate(-1);
    } catch (err: any) {
      message.error(err?.message || "Lỗi khi thêm thiết bị vào phòng");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2">Thêm thiết bị vào phòng</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Thiết bị master"
          name="master_equipment_id"
          rules={[{ required: true, message: "Chọn thiết bị master" }]}
        >
          <Select placeholder="Chọn thiết bị master" loading={isLoading}>
            {availableMasterEquipments.map((eq: any) => (
              <Select.Option key={eq.id} value={eq.id}>
                {eq.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {/* Nếu cần loại thiết bị, có thể lấy từ master hoặc tự động điền */}
        <Form.Item
          label="Số lượng"
          name="quantity"
          rules={[{ required: true, message: "Nhập số lượng" }]}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Số lượng"
          />
        </Form.Item>
        <Form.Item label="Ghi chú" name="note">
          <Input.TextArea placeholder="Ghi chú (nếu có)" />
        </Form.Item>
        <Form.Item className="mt-4">
          <Button type="primary" htmlType="submit">
            Lưu thiết bị
          </Button>
          <Button className="ml-2" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RoomDeviceCreate;
