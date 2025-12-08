import { Button, Card, Form, Input, InputNumber, message } from "antd";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDeviceById, updateDevice } from "@/services/devicesApi";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

const DeviceEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["device", id],
    queryFn: () => getDeviceById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      name: data.name,
      type: data.type || "",
      fee: data.fee || 0,
      description: data.description || "",
    });
  }, [data, form]);

  const updateMut = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        name?: string;
        type?: string;
        fee?: number;
        description?: string;
      };
    }) => updateDevice(id, payload),
    onSuccess: () => {
      message.success("Thiết bị đã được cập nhật");
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      navigate("/admin/devices");
    },
    onError: () => message.error("Cập nhật thiết bị thất bại"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">SỬA THIẾT BỊ</h2>
        <Link to="/admin/devices">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMut.mutate({ id: Number(id), payload: values })}
        >
          <Form.Item
            name="name"
            label="Tên thiết bị"
            rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
          >
            <Input placeholder="Ví dụ: Tivi, Điều hòa, Tủ lạnh..." />
          </Form.Item>
          <Form.Item name="type" label="Loại thiết bị">
            <Input placeholder="Ví dụ: Điện tử, Nội thất, Đồ dùng..." />
          </Form.Item>
          <Form.Item
            name="fee"
            label="Phí bồi thường (VND)"
            rules={[
              { required: true, message: "Vui lòng nhập phí bồi thường" },
              { type: "number", min: 0, message: "Phí phải lớn hơn hoặc bằng 0" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Ví dụ: 500000"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={4}
              placeholder="Mô tả về thiết bị (tùy chọn)"
            />
          </Form.Item>
          <div className="mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMut.isPending}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default DeviceEdit;

