import { Button, Card, Form, Input, message } from "antd";
import { Link } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFloor } from "@/services/floorsApi";
import { useNavigate } from "react-router-dom";

const FloorAdd = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      createFloor(payload),
    onSuccess: () => {
      message.success("Tạo tầng thành công");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      navigate("/admin/floors");
    },
    onError: () => message.error("Tạo tầng thất bại"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM TẦNG MỚI</h2>
        <Link to="/admin/floors">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMut.mutate(values)}
        >
          <Form.Item name="name" label="Tên tầng" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên tầng" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" valuePropName="value">
            <QuillEditor />
          </Form.Item>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Tạo mới
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FloorAdd;
