/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { RoomType } from "@/types/roomtypes";
import type { Floors } from "@/types/floors";
import { createRoom } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";

// 📝 Kiểu dữ liệu form
type FieldType = {
  id?: number | string;
  name?: string;
  price?: number;
  status?: string;
  thumbnail?: string;
  type_id?: number | string;
  floor_id?: number | string;
  capacity?: number;
  description?: string;
};

const RoomAdd = () => {
  const [form] = useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 🏨 Lấy danh sách loại phòng
  const {
    data: roomTypes,
    isLoading,
    isError,
  } = useQuery<RoomType[]>({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  // 🏢 Lấy danh sách tầng
  const { data: floors } = useQuery<Floors[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const { mutate } = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      messageApi.success("Room added successfully");
      form.resetFields();
    },
    onError: (error: unknown) => {
      const msg =
        (error as any)?.response?.data?.message || "Failed to add room";
      messageApi.error(msg);
    },
  });

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    // normalize numeric fields before sending
    const payload: FieldType = {
      id: values.id,
      name: values.name,
      thumbnail: values.thumbnail,
      description: values.description,
      status: values.status,
      type_id: values.type_id ? Number(values.type_id) : undefined,
      floor_id: values.floor_id ? Number(values.floor_id) : undefined,
      price: values.price ? Number(values.price) : undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
    };
    mutate(payload as unknown as Record<string, unknown>);
  };

  if (isLoading) return <div>Loading ...</div>;
  if (isError) return <div>Error loading room types</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {contextHolder}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-md shadow-sm">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Add Room
          </Typography.Title>
          <div className="text-sm text-gray-500">
            Create a new room for a branch
          </div>
        </div>
        <Link to={"/admin/rooms"}>
          <Button type="primary">Back to List</Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="rounded-lg shadow-md">
          <Form
            name="room-add"
            layout="vertical"
            autoComplete="off"
            form={form}
            onFinish={onFinish}
          >
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <Form.Item<FieldType>
                  label="Room Name"
                  name="name"
                  rules={[
                    { required: true, message: "Please input room name!" },
                  ]}
                >
                  <Input placeholder="Ex: Phòng 301" allowClear />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item<FieldType>
                    label="Room Type"
                    name="type_id"
                    rules={[
                      { required: true, message: "Please select room type!" },
                    ]}
                  >
                    <Select placeholder="Select room type">
                      {roomTypes?.map((t) => (
                        <Select.Option key={t.id} value={t.id}>
                          {t.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item<FieldType>
                    label="Floor"
                    name="floor_id"
                    rules={[
                      { required: true, message: "Please select floor!" },
                    ]}
                    getValueFromEvent={(value) => Number(value)}
                  >
                    <Select placeholder="Select floor" loading={!floors}>
                      {floors?.map((f) => (
                        <Select.Option key={f.id} value={f.id}>
                          {f.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Form.Item<FieldType>
                    label="Capacity"
                    name="capacity"
                    rules={[
                      { required: true, message: "Please input capacity!" },
                    ]}
                    getValueFromEvent={(e) => Number(e)}
                  >
                    <InputNumber
                      placeholder="Ex: 2"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>

                  <Form.Item<FieldType>
                    label="Price (VND)"
                    name="price"
                    rules={[
                      { required: true, message: "Please input room price!" },
                    ]}
                    getValueFromEvent={(e) => Number(e)}
                  >
                    <InputNumber
                      placeholder="Ex: 1000000"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </div>

                <Form.Item<FieldType>
                  label="Description"
                  name="description"
                  rules={[
                    { required: true, message: "Please input description!" },
                  ]}
                >
                  <Input.TextArea placeholder="Short description" allowClear />
                </Form.Item>

                <Form.Item<FieldType>
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: "Please input status!" }]}
                >
                  <Input placeholder="e.g., available / booked" allowClear />
                </Form.Item>

                <div className="flex justify-end">
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Submit
                    </Button>
                  </Form.Item>
                </div>
              </div>

              <div className="col-span-4">
                <div className="mb-4">
                  <Form.Item<FieldType>
                    label="Thumbnail URL"
                    name="thumbnail"
                    rules={[
                      { required: true, message: "Please input room image!" },
                    ]}
                  >
                    <Input
                      placeholder="https://picsum.photos/300/300"
                      allowClear
                    />
                  </Form.Item>
                  <div className="text-sm text-gray-500">
                    Example: use an image URL or upload feature later.
                  </div>
                </div>

                <Card size="small" bordered className="text-center">
                  <div className="text-sm font-medium mb-2">Preview</div>
                  <div className="h-40 flex items-center justify-center bg-gray-50 rounded">
                    {/* simple preview using the form value */}
                    <img
                      src={
                        form.getFieldValue("thumbnail") ||
                        "https://picsum.photos/300/300"
                      }
                      alt="thumbnail"
                      className="max-h-36 object-cover rounded"
                    />
                  </div>
                </Card>

                <Card size="small" className="mt-4">
                  <div className="text-sm text-gray-600">
                    Tips:
                    <ul className="list-disc ml-5 mt-2 text-sm">
                      <li>Room Type example: Standard, Deluxe, Suite</li>
                      <li>Floor example: Tầng 1, Tầng 2, Tầng 3</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default RoomAdd;
