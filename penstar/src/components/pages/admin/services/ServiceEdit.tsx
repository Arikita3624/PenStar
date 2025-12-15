/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Card, Form, Input, InputNumber, message, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getServiceById, updateService } from "@/services/servicesApi";
// import { getServiceTypes } from "@/services/serviceTypesApi";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const ServiceEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);

  const { data } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(id as string),
    enabled: !!id,
  });

  // Removed serviceTypes logic

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      name: data.name,
      description: data.description,
      price: data.price,
      // service_type_code: data.service_type_code || "optional",
      is_included: data.is_included || false,
      note: data.note,
    });

    // Set existing images
    if (data.image_url) {
      setImageFileList([
        {
          uid: "-1",
          name: "image.jpg",
          status: "done",
          url: data.image_url,
        },
      ]);
    }
    if (data.thumbnail) {
      setThumbnailFileList([
        {
          uid: "-2",
          name: "thumbnail.jpg",
          status: "done",
          url: data.thumbnail,
        },
      ]);
    }
  }, [data, form]);

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: any) => updateService(id, payload),
    onSuccess: () => {
      message.success("Cập nhật dịch vụ thành công");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/admin/services");
    },
    onError: () => message.error("Cập nhật dịch vụ thất bại"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">CHỈNH SỬA DỊCH VỤ</h2>
        <Link to="/admin/services">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const formData = new FormData();

            // Add form fields
            Object.keys(values).forEach((key) => {
              if (values[key] !== undefined && values[key] !== null) {
                formData.append(key, values[key]);
              }
            });

            // Add image file if new upload
            if (imageFileList.length > 0 && imageFileList[0].originFileObj) {
              formData.append("image", imageFileList[0].originFileObj);
            } else if (imageFileList.length > 0 && imageFileList[0].url) {
              formData.append("image_url", imageFileList[0].url);
            }

            // Add thumbnail file if new upload
            if (
              thumbnailFileList.length > 0 &&
              thumbnailFileList[0].originFileObj
            ) {
              formData.append(
                "thumbnail_file",
                thumbnailFileList[0].originFileObj
              );
            } else if (
              thumbnailFileList.length > 0 &&
              thumbnailFileList[0].url
            ) {
              formData.append("thumbnail", thumbnailFileList[0].url);
            }

            updateMut.mutate({ id, payload: formData });
          }}
        >
          <Form.Item
            name="name"
            label="Tên dịch vụ"
            rules={[{ required: true }]}
          >
            <Input />
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
          <Form.Item name="description" label="Mô tả" valuePropName="value">
            <QuillEditor />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú thêm">
            <Input.TextArea rows={3} />
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

export default ServiceEdit;
