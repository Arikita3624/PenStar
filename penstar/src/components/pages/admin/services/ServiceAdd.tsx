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
import { getServiceTypes } from "@/services/serviceTypesApi";
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

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["service-types"],
    queryFn: getServiceTypes,
  });

  const createMut = useMutation({
    mutationFn: (payload: FormData) => createService(payload),
    onSuccess: () => {
      message.success("Service created");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: () => message.error("Failed to create"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">NEW SERVICE</h2>
        <Link to="/admin/services">
          <Button type="primary">Back</Button>
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
            service_type_code: "optional",
            is_included: false,
          }}
        >
          <Form.Item
            name="name"
            label="Service Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Buffet sáng, Spa massage..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Price (VND)"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item
              name="service_type_code"
              label="Service Type"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select service type">
                {serviceTypes.map((type) => (
                  <Select.Option key={type.code} value={type.code}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="is_included"
            label="Included in room price"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>

          <Form.Item name="note" label="Additional Notes">
            <Input.TextArea
              rows={3}
              placeholder="e.g., Buffet served 6:00 - 10:00 AM"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Image">
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
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item label="Thumbnail">
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
                    <div style={{ marginTop: 8 }}>Upload</div>
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
              Create Service
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ServiceAdd;
