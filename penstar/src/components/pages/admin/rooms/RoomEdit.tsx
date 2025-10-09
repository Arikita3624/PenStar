import { instance } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Typography,
} from "antd";
import { useForm, type FormProps } from "antd/es/form/Form";
import { Link, useParams, useNavigate } from "react-router-dom";

type FieldType = {
  image: string;
  number: string;
  branchId: number | string;
  status: string;
  price: number;
};

type Branch = {
  id: number;
  name: string;
};

const RoomEdit = () => {
  const [form] = useForm();
  // using global message instead of local messageApi/contextHolder
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const response = await instance.get(`/rooms/${id}`);
      return response.data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await instance.get("/branches");
      return response.data;
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (roomData: FieldType) => {
      const response = await instance.put(`/rooms/${id}`, roomData);
      return response.data;
    },
    onSuccess: () => {
      // use global message so it remains visible after navigation
      message.success("Room updated successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/admin/rooms");
    },
    onError: () => {
      message.error("Failed to update room");
      console.log("Error updating room");
    },
  });

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    mutate(values);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6 bg-white p-4">
        <div className="flex items-center gap-2">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Edit Room
          </Typography.Title>
        </div>
        <Link to={"/admin/rooms"}>
          <Button type="primary">Back to List</Button>
        </Link>
      </div>

      <div className="max-w-lg mx-auto">
        <Card bordered={false} className="rounded-lg shadow-md">
          <Form
            name="room-edit"
            layout="vertical"
            autoComplete="off"
            form={form}
            onFinish={onFinish}
            initialValues={rooms}
          >
            <Form.Item<FieldType>
              label="Image"
              name="image"
              rules={[{ required: true, message: "Please input room image!" }]}
            >
              <Input placeholder="Enter image URL" allowClear />
            </Form.Item>

            <Form.Item<FieldType>
              label="Room Number"
              name="number"
              rules={[{ required: true, message: "Please input room number!" }]}
            >
              <Input placeholder="Enter room number" allowClear />
            </Form.Item>

            <Form.Item<FieldType>
              label="Price"
              name="price"
              rules={[{ required: true, message: "Please input room price!" }]}
            >
              <InputNumber
                placeholder="Enter room price"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item<FieldType>
              label="Branch"
              name="branchId"
              rules={[{ required: true, message: "Please select branch!" }]}
            >
              <Select placeholder="Select branch">
                {Array.isArray(branches) &&
                  branches.map((b: Branch) => (
                    <Select.Option key={b.id} value={b.id}>
                      {b.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item<FieldType>
              label="Status"
              name="status"
              rules={[{ required: true, message: "Please input room status!" }]}
            >
              <Input placeholder="Enter status (e.g., Active)" allowClear />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RoomEdit;
