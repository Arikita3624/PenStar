import { instance } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";

const BranchAdd = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (values: any) => {
      await instance.post("/branches", values);
    },
    onSuccess: () => {
      message.success("Branch created successfully!");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      navigate("/admin/branches");
    },
  });

  const onFinish = (values: any) => {
    addMutation.mutate(values);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Branch</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="max-w-md"
      >
        <Form.Item
          label="Branch Name"
          name="name"
          rules={[{ required: true, message: "Please enter branch name!" }]}
        >
          <Input placeholder="e.g. PenStar Da Nang" />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Please enter address!" }]}
        >
          <Input placeholder="e.g. 123 Nguyen Van Linh, Da Nang" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={addMutation.isPending}>
            Create
          </Button>
          <Button onClick={() => navigate(-1)} className="ml-2">
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BranchAdd;
