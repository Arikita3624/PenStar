import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Space,
  Table,
  message,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRoomType,
  deleteRoomType,
  getRoomTypes,
  updateRoomType,
} from "@/services/roomTypeApi";

type RoomTypeItem = { id: number; name: string; description: string };

const RoomType = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeItem | null>(null);
  const [form] = Form.useForm();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      createRoomType(payload),
    onSuccess: () => {
      message.success("Room type created");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      setOpen(false);
      form.resetFields();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create";
      message.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: { name: string; description: string };
    }) => updateRoomType(id, payload),
    onSuccess: () => {
      message.success("Room type updated");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      setOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: () => message.error("Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteRoomType(id),
    onSuccess: () => {
      message.success("Room type deleted");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to delete";
      message.error(msg);
    },
  });

  const onCreate = () => {
    form.validateFields().then((values) => {
      if (editing) {
        updateMut.mutate({ id: editing.id, payload: values });
      } else {
        createMut.mutate(values);
      }
    });
  };

  const columns: ColumnsType<RoomTypeItem> = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Action",
      key: "action",
      render: (_v, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue({
                name: record.name,
                description: record.description,
              });
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete?"
            onConfirm={() => deleteMut.mutate(record.id)}
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Room Types</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
        >
          New
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={types}
          rowKey="id"
          loading={isLoading}
        />
      </Card>

      <Modal
        title={editing ? "Edit Room Type" : "New Room Type"}
        open={open}
        onOk={onCreate}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomType;
