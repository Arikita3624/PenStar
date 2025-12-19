/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Form, Select, InputNumber, Button, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "@/services/roomsApi";
import { getRoomDevices } from "@/services/roomDevicesApi";

const RoomDeviceTransfer = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Lấy danh sách phòng
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });
  // Lấy toàn bộ roomDevices, lọc theo device_id ở frontend
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices-all"],
    queryFn: () => getRoomDevices({}),
  });
  // Lấy thông tin thiết bị phòng hiện tại
  const currentDevice = roomDevices.find(
    (rd: any) => String(rd.id) === String(id)
  );
  const currentRoomId = currentDevice?.room_id;
  const currentQuantity = currentDevice?.quantity ?? 0;
  // Tạo danh sách phòng đã có thiết bị này
  const usedRoomIds = roomDevices
    .filter(
      (rd: any) => String(rd.device_id) === String(currentDevice?.device_id)
    )
    .map((rd: any) => rd.room_id);
  // Không cho chuyển sang phòng hiện tại
  const availableRooms = rooms.filter(
    (r: any) => !usedRoomIds.includes(r.id) && r.id !== currentRoomId
  );

  const onFinish = async (values: any) => {
    // Validate nghiệp vụ
    if (!values.target_room_id) {
      message.error("Vui lòng chọn phòng chuyển đến");
      return;
    }
    if (values.quantity > currentQuantity) {
      message.error("Không được chuyển quá số lượng hiện có");
      return;
    }
    if (values.quantity < 1) {
      message.error("Số lượng chuyển phải lớn hơn 0");
      return;
    }
    setLoading(true);
    try {
      // TODO: call API to transfer device
      message.success("Điều chuyển thiết bị thành công");
      navigate(-1);
    } catch {
      message.error("Lỗi khi điều chuyển thiết bị");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Điều chuyển thiết bị phòng</h2>
      <Form layout="vertical" onFinish={onFinish} autoComplete="off">
        <Form.Item
          label="Phòng chuyển đến"
          name="target_room_id"
          rules={[{ required: true, message: "Chọn phòng chuyển đến" }]}
        >
          <Select placeholder="Chọn phòng">
            {availableRooms.length === 0 ? (
              <Select.Option value={null} disabled>
                Không còn phòng nào khả dụng
              </Select.Option>
            ) : (
              availableRooms.map((room: any) => (
                <Select.Option key={room.id} value={room.id}>
                  {room.name}
                </Select.Option>
              ))
            )}
          </Select>
        </Form.Item>
        <Form.Item
          label={`Số lượng chuyển (tối đa ${currentQuantity})`}
          name="quantity"
          rules={[{ required: true, message: "Nhập số lượng chuyển" }]}
        >
          <InputNumber
            min={1}
            max={currentQuantity}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Điều chuyển
          </Button>
          <Button className="ml-2" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RoomDeviceTransfer;
