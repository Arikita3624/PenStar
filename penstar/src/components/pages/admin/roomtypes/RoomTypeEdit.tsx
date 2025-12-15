import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Upload,
  Row,
  Col,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomTypeById, updateRoomType } from "@/services/roomTypeApi";
import { useNavigate, useParams } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/lib/upload";
import {
  uploadRoomTypeImage,
  getImagesByRoomType,
  deleteRoomTypeImage,
} from "@/services/roomTypeImagesApi";
import type { RoomTypeImage } from "@/types/roomTypeImage";

type FileWithMeta = RcFile & { lastModified?: number };

const RoomTypeEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // File upload states
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [thumbFile, setThumbFile] = useState<RcFile | null>(null);
  const [existingThumbUrl, setExistingThumbUrl] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [existingExtras, setExistingExtras] = useState<RoomTypeImage[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["roomtype", id],
    queryFn: () => getRoomTypeById(id as string),
    enabled: !!id,
  });

  const { data: existingImages = [] } = useQuery({
    queryKey: ["roomtype_images", id],
    queryFn: () => getImagesByRoomType(Number(id)),
    enabled: !!id,
  });

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  // Load existing images
  useEffect(() => {
    if (!existingImages || existingImages.length === 0) return;
    const thumb = existingImages.find((img) => img.is_thumbnail);
    const extras = existingImages.filter((img) => !img.is_thumbnail);
    if (thumb) setExistingThumbUrl(thumb.image_url);
    setExistingExtras(extras);
  }, [existingImages]);

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      name: data.name,
      description: data.description,
      // amenities: data.amenities || [],
      free_amenities: data.free_amenities || [],
      paid_amenities: data.paid_amenities || [],
      capacity: data.capacity,
      base_adults: data.base_adults,
      base_children: data.base_children,
      extra_adult_fee: data.extra_adult_fee,
      extra_child_fee: data.extra_child_fee,
      child_age_limit: data.child_age_limit,
      price: data.price,
      bed_type: data.bed_type,
      view_direction: data.view_direction,
      room_size: data.room_size,
      policies: data.policies || {},
    });
  }, [data, form]);

  const handleFinish = async (values: {
    name: string;
    description: string;
    // amenities?: string[];
    free_amenities?: string[];
    paid_amenities?: string[];
    capacity?: number;
    base_adults?: number;
    base_children?: number;
    extra_adult_fee?: number;
    extra_child_fee?: number;
    child_age_limit?: number;
    price?: number;
    bed_type?: string;
    view_direction?: string;
    room_size?: number;
    policies?: any;
  }) => {
    try {
      // 1. Update room type basic info
      await updateRoomType(id as string, {
        name: values.name,
        description: values.description,
        // amenities: values.amenities,
        free_amenities: values.free_amenities,
        paid_amenities: values.paid_amenities,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        base_adults: values.base_adults
          ? Number(values.base_adults)
          : undefined,
        base_children: values.base_children
          ? Number(values.base_children)
          : undefined,
        extra_adult_fee: values.extra_adult_fee
          ? Number(values.extra_adult_fee)
          : undefined,
        extra_child_fee: values.extra_child_fee
          ? Number(values.extra_child_fee)
          : undefined,
        child_age_limit: values.child_age_limit
          ? Number(values.child_age_limit)
          : undefined,
        price: values.price ? Number(values.price) : undefined,
        bed_type: values.bed_type,
        view_direction: values.view_direction,
        room_size: values.room_size ? Number(values.room_size) : undefined,
        policies: values.policies || {},
      });

      // 2. Handle thumbnail
      if (thumbFile) {
        // Delete old thumbnail if exists
        const oldThumb = existingImages.find((img) => img.is_thumbnail);
        if (oldThumb) {
          try {
            await deleteRoomTypeImage(oldThumb.id);
          } catch (e) {
            console.error("Failed to delete old thumbnail:", e);
          }
        }
        // Upload new thumbnail
        try {
          await uploadRoomTypeImage(Number(id), thumbFile, true);
        } catch (e) {
          console.error("Failed to upload new thumbnail:", e);
        }
      }

      // 3. Upload new gallery images
      if (fileList.length > 0) {
        for (const f of fileList) {
          try {
            await uploadRoomTypeImage(Number(id), f, false);
          } catch (e) {
            console.error("Failed to upload gallery image:", e);
          }
        }
      }

      message.success("Cập nhật loại phòng thành công");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      queryClient.invalidateQueries({ queryKey: ["roomtype", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_images", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_images", id] });
      navigate("/admin/roomtypes");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || "Cập nhật loại phòng thất bại";
      message.error(errorMsg);
    }
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteRoomTypeImage(imageId);
      setExistingExtras((prev) => prev.filter((img) => img.id !== imageId));
      message.success("Xóa ảnh thành công");
    } catch (err) {
      console.error("Failed to delete image:", err);
      message.error("Xóa ảnh thất bại");
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading room type data..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">CHỈNH SỬA LOẠI PHÒNG</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên loại phòng"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nhập tên loại phòng (VD: Deluxe, Suite)" />
              </Form.Item>
              <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[{ required: true }]}
                tooltip="Giá phòng cho loại này"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="1000000"
                />
              </Form.Item>
              <Form.Item
                name="capacity"
                label="Sức chứa tối đa"
                rules={[{ required: true }]}
                tooltip="Tổng số người tối đa (người lớn + trẻ em)"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  placeholder="2"
                />
              </Form.Item>
              <Form.Item name="base_adults" label="Số người lớn cơ bản">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="2"
                />
              </Form.Item>
              <Form.Item name="base_children" label="Số trẻ em cơ bản">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item name="extra_adult_fee" label="Phụ thu người lớn thêm">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item name="extra_child_fee" label="Phụ thu trẻ em thêm">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item name="child_age_limit" label="Giới hạn tuổi trẻ em">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="12"
                />
              </Form.Item>
              <Form.Item name="description" label="Mô tả" valuePropName="value">
                <QuillEditor />
              </Form.Item>
              {/* <Form.Item name="amenities" label="Tiện nghi & Dịch vụ"> */}
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi và nhấn Enter (VD: WiFi, Điều hòa, Tivi...)"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item name="free_amenities" label="Tiện nghi miễn phí">
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi miễn phí và nhấn Enter"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item name="paid_amenities" label="Tiện nghi tính phí">
                <Select
                  mode="tags"
                  placeholder="Nhập tiện nghi tính phí và nhấn Enter"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item name="bed_type" label="Loại giường">
                <Input placeholder="Nhập loại giường (VD: King, Queen, Twin...)" />
              </Form.Item>
              <Form.Item name="view_direction" label="Hướng nhìn">
                <Input placeholder="Nhập hướng nhìn (VD: Biển, Thành phố, Vườn...)" />
              </Form.Item>
              <Form.Item name="room_size" label="Diện tích phòng (m²)">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="25"
                />
              </Form.Item>
              <Form.Item name="policies" label="Chính sách phòng">
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập chính sách phòng (JSON hoặc text)"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item label="Thumbnail">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  fileList={
                    thumbFile
                      ? [
                          {
                            uid: "new-thumb",
                            name: thumbFile.name,
                            status: "done",
                            originFileObj: thumbFile,
                            url: previews.thumb,
                          },
                        ]
                      : existingThumbUrl
                        ? [
                            {
                              uid: "existing",
                              name: "current",
                              status: "done",
                              url: `http://localhost:5000${existingThumbUrl}`,
                            },
                          ]
                        : []
                  }
                  beforeUpload={(file) => {
                    const f = file as RcFile;
                    setThumbFile(f);
                    setPreviews((p) => ({
                      ...p,
                      thumb: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={() => {
                    if (thumbFile) {
                      setThumbFile(null);
                      setPreviews((p) => {
                        const copy = { ...p };
                        if (copy.thumb) URL.revokeObjectURL(copy.thumb);
                        delete copy.thumb;
                        return copy;
                      });
                      return true;
                    }
                    // If removing existing thumbnail
                    setExistingThumbUrl(null);
                    return true;
                  }}
                >
                  {!thumbFile && !existingThumbUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <PlusOutlined className="text-2xl" />
                      <div className="mt-2">Tải ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Gallery Images">
                {/* Ảnh bổ sung */}
                {existingExtras.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">Ảnh đã có:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {existingExtras.map((img) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={`http://localhost:5000${img.image_url}`}
                            alt=""
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            danger
                            size="small"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteExistingImage(img.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New image uploads */}
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  multiple
                  fileList={fileList.map((f, i) => ({
                    uid: `${i}`,
                    name: f.name,
                    status: "done",
                    originFileObj: f,
                    url: previews[
                      `${f.name}-${f.size}-${(f as FileWithMeta).lastModified}`
                    ],
                  }))}
                  beforeUpload={(file) => {
                    const f = file as RcFile;
                    setFileList((prev) => {
                      const exists = prev.some(
                        (p) =>
                          p.name === f.name &&
                          p.size === f.size &&
                          (p as FileWithMeta).lastModified ===
                            (f as FileWithMeta).lastModified
                      );
                      if (exists) return prev;
                      return [...prev, f];
                    });
                    const key = `${f.name}-${f.size}-${
                      (f as FileWithMeta).lastModified
                    }`;
                    setPreviews((p) => ({
                      ...p,
                      [key]: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={(file) => {
                    const origin = (
                      file as unknown as { originFileObj?: RcFile }
                    ).originFileObj;
                    if (!origin) return true;
                    const key = `${origin.name}-${origin.size}-${
                      (origin as FileWithMeta).lastModified
                    }`;
                    setFileList((prev) => prev.filter((p) => p !== origin));
                    setPreviews((p) => {
                      const copy = { ...p };
                      if (copy[key]) URL.revokeObjectURL(copy[key]);
                      delete copy[key];
                      return copy;
                    });
                    return true;
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <PlusOutlined className="text-2xl" />
                    <div className="mt-2">Upload</div>
                  </div>
                </Upload>
                <div className="text-xs text-gray-500 mt-2">
                  Ảnh mới tải lên: {fileList.length}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Lưu thay đổi
              </Button>
              <Link to="/admin/roomtypes">
                <Button size="large">Hủy</Button>
              </Link>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RoomTypeEdit;
