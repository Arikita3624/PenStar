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
      message.success("Floor created");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      navigate("/admin/floors");
    },
    onError: () => message.error("Failed to create"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">NEW FLOOR</h2>
        <Link to="/admin/floors">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMut.mutate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FloorAdd;
