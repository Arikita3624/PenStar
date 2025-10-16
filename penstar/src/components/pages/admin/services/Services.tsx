import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Table,
  message,
  Space,
} from "antd";
import type { InputNumberProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState } from "react";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Services } from "@/types/services";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/services/servicesApi";

// Small wrapper to avoid strict InputNumber parser/formatter typing issues in this repo
const SafeInputNumber = (props: InputNumberProps) => <InputNumber {...props} />;

const ServicesPage = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Services | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const filteredServices = services.filter((s: Services) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return String(s.name ?? "")
      .toLowerCase()
      .includes(q);
  });

  const createMut = useMutation({
    mutationFn: (payload: Partial<Services>) =>
      createService(payload as Services),
    onSuccess: () => {
      message.success("Service created");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Failed to create"),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: Partial<Services>;
    }) => updateService(id, payload as Services),
    onSuccess: () => {
      message.success("Service updated");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      setEditing(null);
      form.resetFields();
    },
    onError: () => message.error("Failed to update"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteService(id),
    onSuccess: () => {
      message.success("Service deleted");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => message.error("Failed to delete"),
  });

  const columns: ColumnsType<Services> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(p),
    },
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
                price: record.price,
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
        <h1 className="text-2xl font-bold">SERVICES</h1>
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
            onClick={() => {
              setEditing(null);
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
          dataSource={filteredServices}
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
        title={editing ? "Edit Service" : "New Service"}
        open={open}
        onOk={() => form.submit()}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const payload = {
              name: values.name,
              description: values.description ?? "",
              price: Number(String(values.price).replace(/[^0-9.-]+/g, "")),
            };
            if (editing) updateMut.mutate({ id: editing.id, payload });
            else createMut.mutate(payload);
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
                      await import("@/services/servicesApi")
                    ).checkServiceNameExists(name, editing?.id);
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
            name="price"
            label="Price"
            rules={[
              { required: true, message: "Price is required" },
              {
                validator: (_rule, value) => {
                  const raw = String(value ?? "");
                  const n = Number(raw.replace(/[^0-9.-]+/g, ""));
                  if (Number.isNaN(n))
                    return Promise.reject(new Error("Price must be a number"));
                  if (n <= 0)
                    return Promise.reject(new Error("Price must be > 0"));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <SafeInputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value: string | number | undefined) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value: string = "") => value.replace(/\$|,|\s/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Description is required" }]}
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ServicesPage;
