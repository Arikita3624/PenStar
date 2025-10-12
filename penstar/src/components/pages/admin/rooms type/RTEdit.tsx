import { instance } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

const RTEdit = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Lấy thông tin room type theo id
  const { data, isLoading } = useQuery({
    queryKey: ["roomType", id],
    queryFn: async () => {
      const res = await instance.get(`/room-types/${id}`);
      return res.data;
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: { name: string; description: string }) => {
      const res = await instance.patch(`/room-types/${id}`, values);
      return res.data;
    },
    onSuccess: () => {
      messageApi.success("Room type updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
      navigate("/admin/room-types");
    },
    onError: () => {
      messageApi.error("Failed to update room type");
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const onFinish = (values: { name: string; description: string }) => {
    mutate(values);
  };

  return (
    <div className="max-w-lg mx-auto">
      {contextHolder}
      <h1 className="text-2xl font-bold mb-4">Edit Room Type</h1>

      <Form
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: data?.name,
          description: data?.description,
        }}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter room type name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isPending}>
            Update
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RTEdit;
