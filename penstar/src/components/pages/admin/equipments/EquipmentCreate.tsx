/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Form, Input, InputNumber, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { createMasterEquipment } from "@/services/masterEquipmentsApi";

const EquipmentCreate = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await createMasterEquipment(values);
      message.success("Thêm thiết bị thành công");
      navigate("/admin/equipments");
    } catch (err) {
      message.error("Lỗi khi thêm thiết bị");
    } finally {
      setLoading(false);
    }
  };

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
            {" "}
            <Input placeholder="VD: TV Samsung 43 inch" />{" "}
          </Form.Item>
          <Form.Item
            label="Loại thiết bị *"
            name="type"
            rules={[{ required: true, message: "Nhập loại thiết bị" }]}
          >
            {" "}
            <Input placeholder="VD: Tivi, Điều hòa..." />{" "}
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            label="Giá nhập *"
            name="import_price"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            {" "}
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Giá nhập (VNĐ)"
            />{" "}
          </Form.Item>
          <Form.Item
            label="Giá tổn thất *"
            name="compensation_price"
            rules={[{ required: true, message: "Nhập giá tổn thất" }]}
          >
            {" "}
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Giá tổn thất (VNĐ)"
            />{" "}
          </Form.Item>
          <Form.Item
            label="Tổng số lượng *"
            name="total_stock"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            {" "}
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Số lượng ban đầu"
            />{" "}
          </Form.Item>
        </div>
        <Form.Item className="mt-4">
          <Button type="primary" htmlType="submit" loading={loading}>
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
