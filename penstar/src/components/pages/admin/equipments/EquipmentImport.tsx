/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Form, InputNumber, Button, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMasterEquipments } from "@/services/masterEquipmentsApi";
import { importEquipmentStock } from "@/services/equipmentStockLogsApi";
import TextArea from "antd/es/input/TextArea";

const EquipmentImport = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { data: equipments = [] } = useQuery({
    queryKey: ["master-equipments"],
    queryFn: getMasterEquipments,
  });

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await importEquipmentStock({
        equipment_id: values.equipment_id,
        quantity: values.quantity,
        note: values.note || "",
      });
      message.success("Nhập kho thành công");
      navigate("/admin/equipments");
    } catch (err) {
      message.error("Lỗi khi nhập kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        Nhập kho thiết bị
      </h2>
      <p className="mb-6 text-gray-500">
        Chọn thiết bị và nhập số lượng cần bổ sung vào kho. Các trường có dấu *
        là bắt buộc.
      </p>
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="space-y-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Thiết bị *"
            name="equipment_id"
            rules={[{ required: true, message: "Chọn thiết bị" }]}
          >
            <Select showSearch placeholder="Chọn thiết bị">
              {equipments.map((eq: any) => (
                <Select.Option key={eq.id} value={eq.id}>
                  {eq.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Số lượng nhập *"
            name="quantity"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Số lượng nhập"
            />
          </Form.Item>
        </div>
        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={2} placeholder="Ghi chú (nếu có)" />
        </Form.Item>
        <Form.Item className="mt-4">
          <Button type="primary" htmlType="submit" loading={loading}>
            Nhập kho
          </Button>
          <Button className="ml-2" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EquipmentImport;
