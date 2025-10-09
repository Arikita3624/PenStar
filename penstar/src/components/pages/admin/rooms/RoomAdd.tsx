import { instance } from "@/services/api";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Link } from "react-router-dom";

type FieldType = {
  id?: number | string;
  image?: string;
  number?: string;
  branchId?: number | string;
  status?: string;
  price?: number;
};

type Branch = {
  id?: number;
  name?: string;
};

const RoomAdd = () => {
  const [form] = useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await instance.get("/branches");
      return response.data;
    },
  });

  const { mutate } = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (room: any) => {
      const response = await instance.post("/rooms", room);
      return response.data;
    },
    onSuccess: () => {
      messageApi.success("Room added successfully");
      form.resetFields();
    },
    onError: () => {
      messageApi.error("Failed to add room");
      console.log("Error adding room");
    },
  });

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    console.log("Success:", values);
    mutate(values);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {contextHolder}
      <div className="flex items-center justify-between mb-6 bg-white p-4">
        <div className="flex items-center gap-2">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Add Room
          </Typography.Title>
        </div>
        <Link to={"/admin/rooms"}>
          <Button type="primary">Back to List</Button>
        </Link>
      </div>
      <div className="max-w-lg mx-auto">
        <Card bordered={false} className="rounded-lg shadow-md">
          <Form
            name="room-add"
            layout="vertical"
            autoComplete="off"
            form={form}
            onFinish={onFinish}
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
              <Select placeholder="Select branch" loading={!branches}>
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
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RoomAdd;
