/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Form, Input, message } from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFloorById, updateFloor } from "@/services/floorsApi";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

const FloorEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["floor", id],
    queryFn: () => getFloorById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({ name: data.name, description: data.description });
  }, [data, form]);

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateFloor(id, payload),
    onSuccess: () => {
      message.success("Floor updated");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      navigate("/admin/floors");
    },
    onError: () => message.error("Failed to update"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">EDIT FLOOR</h2>
        <Link to="/admin/floors">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMut.mutate({ id, payload: values })}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FloorEdit;
