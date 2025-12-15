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
      message.success("Cập nhật tầng thành công");
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      navigate("/admin/floors");
    },
    onError: () => message.error("Cập nhật tầng thất bại"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">CHỈNH SỬA TẦNG</h2>
        <Link to="/admin/floors">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMut.mutate({ id, payload: values })}
        >
          <Form.Item name="name" label="Tên tầng" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên tầng" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" valuePropName="value">
            <QuillEditor />
          </Form.Item>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default FloorEdit;
