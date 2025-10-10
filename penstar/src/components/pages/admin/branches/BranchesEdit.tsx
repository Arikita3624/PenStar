import { instance } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

const BranchEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🟢 Lấy thông tin chi nhánh theo id
  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch", id],
    queryFn: async () => {
      const response = await instance.get(`/branches/${id}`);
      return response.data;
    },
  });

  // 🟡 Cập nhật chi nhánh
  const editMutation = useMutation({
    mutationFn: async (values: any) => {
      await instance.put(`/branches/${id}`, values);
    },
    onSuccess: () => {
      message.success("Branch updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      navigate("/admin/branches");
    },
  });

  const onFinish = (values: any) => {
    editMutation.mutate(values);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Branch</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="max-w-md"
        initialValues={branch}
      >
        <Form.Item
          label="Branch Name"
          name="name"
          rules={[{ required: true, message: "Please enter branch name!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Please enter address!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={editMutation.isPending}>
            Save Changes
          </Button>
          <Button onClick={() => navigate(-1)} className="ml-2">
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BranchEdit;
