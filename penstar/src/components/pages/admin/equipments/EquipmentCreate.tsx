/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form, Input, InputNumber, Button, message, Select } from "antd";
// ...existing code...
import { useNavigate } from "react-router-dom";
import { createMasterEquipment } from "@/services/masterEquipmentsApi";
import { useQuery } from "@tanstack/react-query";
import { getEquipmentTypes } from "@/services/equipmentTypesApi";

const EquipmentCreate = () => {
  const { data: equipmentTypes = [], isLoading } = useQuery({
    queryKey: ["equipment-types"],
    queryFn: getEquipmentTypes,
  });
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    await createMasterEquipment(values);
    message.success("Thêm thiết bị thành công");
    navigate("/admin/equipments");
  };

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        Thêm thiết bị
      </h2>
      <p className="mb-6 text-gray-500">
        Nhập thông tin chi tiết cho thiết bị master mới. Các trường có dấu * là
        bắt buộc.
      </p>
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="space-y-2"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            label="Tên thiết bị *"
            name="name"
            rules={[{ required: true, message: "Nhập tên thiết bị" }]}
          >
            <Input placeholder="VD: TV Samsung 43 inch" />
          </Form.Item>
          <Form.Item
            label="Loại thiết bị *"
            name="type"
            rules={[{ required: true, message: "Chọn loại thiết bị" }]}
          >
            <Select placeholder="Chọn loại thiết bị" loading={isLoading}>
              {equipmentTypes.map((type: string) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
              <Select.Option value="Khác">Khác</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            label="Giá nhập *"
            name="import_price"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Giá nhập (VNĐ)"
            />
          </Form.Item>
          <Form.Item
            label="Giá tổn thất *"
            name="compensation_price"
            rules={[{ required: true, message: "Nhập giá tổn thất" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Giá tổn thất (VNĐ)"
            />
          </Form.Item>
          <Form.Item
            label="Tổng số lượng *"
            name="total_stock"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Số lượng ban đầu"
            />
          </Form.Item>
        </div>
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

export default EquipmentCreate;
