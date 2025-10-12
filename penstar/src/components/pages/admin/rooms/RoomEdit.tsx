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
import { getRoomID, updateRoom } from "@/services/roomsApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";

type FieldType = {
  id?: number | string;
  name?: string;
  thumbnail?: string;
  type_id?: number | string;
  floor_id?: number | string;
  capacity?: number;
  price?: number;
  description?: string;
  status?: string;
};

const RoomEdit = () => {
  const [form] = useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: room,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => getRoomID(id as string),
  });

  type RoomType = { id: number | string; name: string };
  type FloorType = { id: number | string; name: string };

  const { data: room_types } = useQuery<RoomType[]>({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  const { data: floors } = useQuery<FloorType[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const { mutate } = useMutation({
    mutationFn: async (roomData: FieldType) => {
      return updateRoom(id as string, roomData as Record<string, unknown>);
    },
    onSuccess: () => {
      message.success("Room updated successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      navigate("/admin/rooms");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to update room";
      message.error(msg);
      console.error("Error updating room", error);
    },
  });

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const payload: FieldType = {
      ...values,
      type_id: values.type_id ? Number(values.type_id) : undefined,
      floor_id: values.floor_id ? Number(values.floor_id) : undefined,
      price: values.price ? Number(values.price) : undefined,
      capacity: values.capacity ? Number(values.capacity) : undefined,
    };
    mutate(payload);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-md">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Edit Room
          </Typography.Title>
          <div className="text-sm text-gray-500">Modify room details</div>
        </div>
        <Link to={"/admin/rooms"}>
          <Button type="primary">Back to List</Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card className="rounded-lg shadow-md">
          <Form
            name="room-edit"
            layout="vertical"
            autoComplete="off"
            form={form}
            onFinish={onFinish}
            initialValues={room ?? undefined}
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
                      {room_types?.map((t) => (
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
                      Save Changes
                    </Button>
                  </Form.Item>
                </div>
              </div>

              <div className="col-span-4">
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

                <Card size="small" bordered className="text-center">
                  <div className="text-sm font-medium mb-2">Preview</div>
                  <div className="h-40 flex items-center justify-center bg-gray-50 rounded">
                    <img
                      src={
                        form.getFieldValue("thumbnail") ||
                        room?.thumbnail ||
                        "https://picsum.photos/300/300"
                      }
                      alt="thumbnail"
                      className="max-h-36 object-cover rounded"
                    />
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

export default RoomEdit;
