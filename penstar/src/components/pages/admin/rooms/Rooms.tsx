// services used: roomsApi wrapper functions
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  message,
  Popconfirm,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
} from "antd";
import { Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Room } from "@/types/room";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "@/services/roomsApi";
import { getFloors } from "@/services/floorsApi";
import { getRoomTypes } from "@/services/roomTypeApi";

import { useState } from "react";
import QuillEditor from "@/components/common/QuillEditor";

const Rooms = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [filterTypeId, setFilterTypeId] = useState<number | string | null>(
    null
  );
  const [filterFloorId, setFilterFloorId] = useState<number | string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  type FloorShort = { id: number | string; name: string };
  const { data: floors } = useQuery<FloorShort[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  console.log(floors);

  type RoomTypeShort = { id: number | string; name: string };
  const { data: room_types } = useQuery<RoomTypeShort[]>({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  console.log(room_types);

  const { mutate: deleteMut } = useMutation({
    mutationFn: async (id: number) => deleteRoom(id),
    onSuccess: () => {
      messageApi.success("Room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      messageApi.error("Failed to delete room");
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form] = Form.useForm();

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createRoom(payload),
    onSuccess: () => {
      messageApi.success("Room created successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
      form.resetFields();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create room";
      messageApi.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Record<string, unknown>;
    }) => updateRoom(id, payload),
    onSuccess: () => {
      messageApi.success("Room updated successfully");
      setOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update room";
      messageApi.error(msg);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const filteredRooms = rooms?.filter((r) => {
    if (filterTypeId && String(r.type_id) !== String(filterTypeId))
      return false;
    if (filterFloorId && String(r.floor_id) !== String(filterFloorId))
      return false;
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (q) {
      const name = String(
        (r as unknown as Record<string, unknown>).name ?? ""
      ).toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const columns: ColumnsType<Room> = [
    {
      title: "STT",
      key: "stt",
      render: (_value, _record, index) =>
        index + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumbnail) => <img src={thumbnail} width={50} alt="" />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const meta: Record<string, { label: string; color: string }> = {
          available: { label: "Available", color: "green" },
          booked: { label: "Booked", color: "gold" },
          occupied: { label: "Occupied", color: "orange" },
          unavailable: { label: "Unavailable", color: "red" },
          cleaning: { label: "Cleaning", color: "purple" },
          checked_out: { label: "Checked-out (History)", color: "blue" },
          no_show: { label: "No-show", color: "magenta" },
          pending_payment: { label: "Pending Payment", color: "cyan" },
          cancelled: { label: "Cancelled", color: "volcano" },
        };
        const m = meta[String(status)] || {
          label: String(status).toUpperCase(),
          color: "default",
        };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    {
      title: "Type",
      dataIndex: "type_id",
      key: "type_id",
      render: (type_id) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room_types?.find((type: any) => String(type.id) === String(type_id))
          ?.name || "N/A",
    },
    {
      title: "Floor",
      dataIndex: "floor_id",
      key: "floor_id",
      render: (floor_id) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        floors?.find((floor: any) => String(floor.id) === String(floor_id))
          ?.name || "N/A",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Action",
      key: "action",
      render: (_, room) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(room as Room);
              const roomObj = room as unknown as Record<string, unknown>;
              const nameValue =
                (roomObj.name as string) ||
                (roomObj.number as string) ||
                (roomObj.title as string) ||
                "";
              const thumbnailValue =
                (roomObj.thumbnail as string) ||
                (roomObj.image as string) ||
                "";

              form.setFieldsValue({
                name: nameValue,
                thumbnail: thumbnailValue,
                type_id: (room as Room).type_id,
                floor_id: (room as Room).floor_id,
                capacity: (room as Room).capacity,
                price: (room as Room).price,
                description: (room as Room).description,
                status: (room as Room).status,
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete"
            description="Are you sure to delete this room?"
            onConfirm={() => deleteMut((room as Room).id)}
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ROOM LIST</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Search by room name"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="Filter by room type"
            style={{ width: 200 }}
            value={filterTypeId ?? undefined}
            onChange={(val) => {
              setFilterTypeId(val ?? null);
              setCurrentPage(1);
            }}
          >
            {room_types?.map((t) => (
              <Select.Option key={t.id} value={t.id}>
                {t.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="Filter by floor"
            style={{ width: 200 }}
            value={filterFloorId ?? undefined}
            onChange={(val) => {
              setFilterFloorId(val ?? null);
              setCurrentPage(1);
            }}
          >
            {floors?.map((f) => (
              <Select.Option key={f.id} value={f.id}>
                {f.name}
              </Select.Option>
            ))}
          </Select>

          <Button
            onClick={() => {
              setFilterTypeId(null);
              setFilterFloorId(null);
              setCurrentPage(1);
            }}
          >
            Clear
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <Table
          columns={columns}
          dataSource={filteredRooms ?? rooms}
          rowKey="id"
          pagination={{
            pageSize: pageSize,
            current: currentPage,
            onChange: (page) => setCurrentPage(page),
          }}
        />
        <Modal
          title={editing ? "Edit Room" : "New Room"}
          open={open}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={800}
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => {
                const payload = {
                  ...values,
                  type_id: values.type_id ? Number(values.type_id) : undefined,
                  floor_id: values.floor_id
                    ? Number(values.floor_id)
                    : undefined,
                  price: values.price ? Number(values.price) : undefined,
                  capacity: values.capacity
                    ? Number(values.capacity)
                    : undefined,
                } as Record<string, unknown>;

                if (editing) {
                  updateMut.mutate({ id: editing.id as number, payload });
                } else {
                  createMut.mutate(payload);
                }
              }}
            >
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8">
                  <Form.Item
                    name="name"
                    label="Room Name"
                    rules={[
                      { required: true, message: "Name is required" },
                      {
                        validator: async (_rule, value) => {
                          const name = String(value ?? "").trim();
                          if (!name)
                            return Promise.reject(
                              new Error("Name is required")
                            );
                          const type_id = form.getFieldValue("type_id");
                          // If no type selected yet, skip server check
                          if (!type_id) return Promise.resolve();
                          // Call API to check existence
                          const exists = await (
                            await import("@/services/roomsApi")
                          ).checkRoomNameExists(
                            name,
                            Number(type_id),
                            editing?.id
                          );
                          if (exists)
                            return Promise.reject(
                              new Error(
                                "Room name already exists for this room type"
                              )
                            );
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input />
                  </Form.Item>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      name="type_id"
                      label="Room Type"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select room type">
                        {room_types?.map((t) => (
                          <Select.Option key={t.id} value={t.id}>
                            {t.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="floor_id"
                      label="Floor"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select floor">
                        {floors?.map((f) => (
                          <Select.Option key={f.id} value={f.id}>
                            {f.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                      name="capacity"
                      label="Capacity"
                      rules={[
                        { required: true, message: "Capacity is required" },
                        {
                          validator: (_rule, value) => {
                            const n = Number(value);
                            if (Number.isNaN(n))
                              return Promise.reject(
                                new Error("Capacity must be a number")
                              );
                            if (!Number.isInteger(n) || n <= 0)
                              return Promise.reject(
                                new Error("Capacity must be a positive integer")
                              );
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                      name="price"
                      label="Price (VND)"
                      rules={[
                        { required: true, message: "Price is required" },
                        {
                          validator: (_rule, value) => {
                            const n = Number(
                              String(value ?? "").replace(/[^0-9.-]+/g, "")
                            );
                            if (Number.isNaN(n))
                              return Promise.reject(
                                new Error("Price must be a number")
                              );
                            if (n <= 0)
                              return Promise.reject(
                                new Error("Price must be > 0")
                              );
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      {/* Formatted InputNumber with thousands separator */}
                      <InputNumber
                        style={{ width: "100%" }}
                        formatter={(value) =>
                          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                        }
                        parser={(value: string = "") =>
                          value.replace(/\$|,|\s/g, "")
                        }
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="description"
                    label="Description"
                    valuePropName="value"
                  >
                    <QuillEditor />
                  </Form.Item>
                </div>

                <div className="col-span-4">
                  <Form.Item
                    name="thumbnail"
                    label="Thumbnail URL"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>

                  <Card size="small" className="text-center">
                    <div className="text-sm font-medium mb-2">Preview</div>
                    <div className="h-40 flex items-center justify-center bg-gray-50 rounded">
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

                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Status is required" }]}
                  >
                    <Select placeholder="Select status">
                      <Select.Option value="available">Available</Select.Option>
                      <Select.Option value="booked">Booked</Select.Option>
                      <Select.Option value="occupied">Occupied</Select.Option>
                      <Select.Option value="unavailable">
                        Unavailable
                      </Select.Option>
                      <Select.Option value="cleaning">Cleaning</Select.Option>
                      <Select.Option value="checked_out">
                        Checked-out (History)
                      </Select.Option>
                      <Select.Option value="no_show">No-show</Select.Option>
                      <Select.Option value="pending_payment">
                        Pending Payment
                      </Select.Option>
                      <Select.Option value="cancelled">Cancelled</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </Form>
          </Card>
        </Modal>
      </div>
    </div>
  );
};

export default Rooms;
