import { instance } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";

const RTAdd = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await instance.post("/room-types", data);
      return res.data;
    },
    onSuccess: () => {
      messageApi.success("Room type created successfully");
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
      navigate("/admin/room-types");
    },
    onError: () => {
      messageApi.error("Failed to create room type");
    },
  });

  const onFinish = (values: { name: string; description: string }) => {
    mutate(values);
  };

  return (
    <div className="max-w-lg mx-auto">
      {contextHolder}
      <h1 className="text-2xl font-bold mb-4">Create Room Type</h1>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter room type name" }]}
        >
          <Input placeholder="Deluxe, Suite, VIP..." />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} placeholder="Description of the room type" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RTAdd;
