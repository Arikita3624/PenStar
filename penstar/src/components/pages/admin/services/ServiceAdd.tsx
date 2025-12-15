import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
  Upload,
} from "antd";
import { Link } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createService } from "@/services/servicesApi";
// import { getServiceTypes } from "@/services/serviceTypesApi";
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UploadFile } from "antd";

const ServiceAdd = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);

  // Removed serviceTypes logic

  const createMut = useMutation({
    mutationFn: (payload: FormData) => createService(payload),
    onSuccess: () => {
      message.success("Tạo dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: () => message.error("Tạo dịch vụ thất bại"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM DỊCH VỤ MỚI</h2>
        <Link to="/admin/services">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const formData = new FormData();

            // Add form fields
            Object.keys(values).forEach((key) => {
              if (values[key] !== undefined && values[key] !== null) {
                formData.append(key, values[key]);
              }
            });

            // Add image file
            if (imageFileList.length > 0 && imageFileList[0].originFileObj) {
              formData.append("image", imageFileList[0].originFileObj);
            }

            // Add thumbnail file
            if (
              thumbnailFileList.length > 0 &&
              thumbnailFileList[0].originFileObj
            ) {
              formData.append(
                "thumbnail_file",
                thumbnailFileList[0].originFileObj
              );
            }

            createMut.mutate(formData);
          }}
          initialValues={{
            is_included: false,
          }}
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true }]}
          >
            <Input placeholder="VD: Buffet sáng, Spa massage..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Giá (VND)"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            {/* Removed service_type_code field */}
          </div>

          <Form.Item
            name="is_included"
            label="Bao gồm giá phòng"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name="description" label="Mô tả" valuePropName="value">
            <QuillEditor />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú thêm">
            <Input.TextArea
              rows={3}
              placeholder="VD: Buffet phục vụ 6:00 - 10:00 sáng"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Ảnh dịch vụ">
              <Upload
                listType="picture-card"
                fileList={imageFileList}
                onChange={({ fileList }) => setImageFileList(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                {imageFileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item label="Ảnh đại diện">
              <Upload
                listType="picture-card"
                fileList={thumbnailFileList}
                onChange={({ fileList }) => setThumbnailFileList(fileList)}
                beforeUpload={() => false}
                maxCount={1}
              >
                {thumbnailFileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </div>

          <div className="mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={createMut.isPending}
            >
              Tạo dịch vụ
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceAdd;
