import { Button, Card, Form, Input, InputNumber, message } from "antd";
import { Link } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createService } from "@/services/servicesApi";
import { useNavigate } from "react-router-dom";

const ServiceAdd = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: (payload: {
      name: string;
      description: string;
      price: number;
    }) => createService(payload),
    onSuccess: () => {
      message.success("Service created");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: () => message.error("Failed to create"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">NEW SERVICE</h2>
        <Link to="/admin/services">
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
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} />
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

export default ServiceAdd;
