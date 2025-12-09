import { Button, Card, Form, Input, InputNumber, message } from "antd";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDevice } from "@/services/devicesApi";
import { useNavigate } from "react-router-dom";

const DeviceAdd = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: (payload: {
      name: string;
      type?: string;
      fee?: number;
      description?: string;
    }) => createDevice(payload),
    onSuccess: () => {
      message.success("Thiết bị đã được tạo");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      navigate("/admin/devices");
    },
    onError: () => message.error("Tạo thiết bị thất bại"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM THIẾT BỊ MỚI</h2>
        <Link to="/admin/devices">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMut.mutate(values)}
        >
          <Form.Item
            name="name"
            label="Tên thiết bị"
            rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
          >
            <Input placeholder="Ví dụ: Tivi, Điều hòa, Tủ lạnh..." />
          </Form.Item>
          <Form.Item name="type" label="Loại thiết bị">
            <Input placeholder="Ví dụ: Điện tử, Nội thất, Đồ dùng..." />
          </Form.Item>
          <Form.Item
            name="fee"
            label="Phí bồi thường (VND)"
            rules={[
              { required: true, message: "Vui lòng nhập phí bồi thường" },
              { type: "number", min: 0, message: "Phí phải lớn hơn hoặc bằng 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ví dụ: 500000"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả về thiết bị (tùy chọn)"
            />
          </Form.Item>
          <div className="mt-4">
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              Tạo thiết bị
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default DeviceAdd;

