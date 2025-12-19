/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Form, InputNumber, Button, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useQuery } from "@tanstack/react-query";
import { getRoomDevices, updateRoomDevice } from "@/services/roomDevicesApi";

const RoomDeviceEdit = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Lấy thông tin thiết bị phòng theo id
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices-all"],
    queryFn: () => getRoomDevices({}),
  });
  const currentDevice = roomDevices.find(
    (rd: any) => String(rd.id) === String(id)
  );

  useEffect(() => {
    if (currentDevice) {
      form.setFieldsValue({
        quantity: currentDevice.quantity,
        note: currentDevice.note || "",
      });
    }
  }, [currentDevice, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await updateRoomDevice(Number(id), values);
      message.success("Cập nhật tồn kho thành công");
      navigate(-1);
    } catch {
      message.error("Lỗi khi cập nhật tồn kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sửa tồn kho thiết bị phòng</h2>
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        form={form}
      >
        <Form.Item
          label="Số lượng"
          name="quantity"
          rules={[{ required: true, message: "Nhập số lượng" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
          <Button className="ml-2" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RoomDeviceEdit;
