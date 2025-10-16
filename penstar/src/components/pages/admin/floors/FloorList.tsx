import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Table,
  message,
  Popconfirm,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFloor, getFloors } from "@/services/floorsApi";
import { deleteFloor, updateFloor } from "@/services/floorsApi";
import type { Floors } from "@/types/floors";

const FloorList = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Floors | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: floors = [], isLoading } = useQuery<Floors[]>({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

  const filteredFloors = floors.filter((f: Floors) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(f.name ?? "")
      .toLowerCase()
      .includes(q);
  });

  const createMut = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      createFloor(payload),
    onSuccess: () => {
      message.success("Floor created");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create floor";
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
    }) => updateFloor(id, payload),
    onSuccess: () => {
      message.success("Floor updated");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      setOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: () => message.error("Failed to update floor"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteFloor(id),
    onSuccess: () => {
      message.success("Floor deleted");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
    },
    onError: (err: unknown) => {
      const serverMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      const msg = serverMsg || "Failed to delete floor";
      message.error(msg);
    },
  });

  const columns: ColumnsType<Floors> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
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
        <h1 className="text-2xl font-bold">FLOORS</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Search by name"
            allowClear
            style={{ width: 260 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setOpen(true);
            }}
          >
            New
          </Button>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredFloors}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Floor" : "New Floor"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editing) {
              updateMut.mutate({ id: editing.id as number, payload: values });
            } else {
              createMut.mutate(values);
            }
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Name required" },
              {
                validator: async (_rule, value) => {
                  const name = String(value ?? "").trim();
                  if (!name) return Promise.reject(new Error("Name required"));
                  try {
                    const exists = await (
                      await import("@/services/floorsApi")
                    ).checkFloorNameExists(name, editing?.id);
                    if (exists)
                      return Promise.reject(new Error("Name already exists"));
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("Name validation failed"));
                  }
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FloorList;
