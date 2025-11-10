import {
  Button,
  Card,
  Form,
  Input,
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
      amenities: data.amenities || [],
    });
  }, [data, form]);

  const handleFinish = async (values: {
    name: string;
    description: string;
    amenities?: string[];
  }) => {
    try {
      // 1. Update room type basic info
      await updateRoomType(id as string, {
        name: values.name,
        description: values.description,
        amenities: values.amenities,
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

      message.success("Room type updated successfully");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      queryClient.invalidateQueries({ queryKey: ["roomtype", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_images", id] });
      queryClient.invalidateQueries({ queryKey: ["roomtype_images", id] });
      navigate("/admin/roomtypes");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || "Failed to update room type";
      message.error(errorMsg);
    }
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    try {
      await deleteRoomTypeImage(imageId);
      setExistingExtras((prev) => prev.filter((img) => img.id !== imageId));
      message.success("Image deleted");
    } catch (err) {
      console.error("Failed to delete image:", err);
      message.error("Failed to delete image");
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
        <h2 className="text-2xl font-bold mb-4">EDIT ROOM TYPE</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Enter room type name (e.g., Deluxe, Suite)" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                valuePropName="value"
              >
                <QuillEditor />
              </Form.Item>

              <Form.Item name="amenities" label="Amenities & Services">
                <Select
                  mode="tags"
                  placeholder="Type amenity and press Enter (e.g., WiFi, Air Conditioning, TV...)"
                  style={{ width: "100%" }}
                  options={[
                    { label: "WiFi miễn phí", value: "WiFi miễn phí" },
                    { label: "Điều hòa", value: "Điều hòa" },
                    { label: "Tivi LCD", value: "Tivi LCD" },
                    { label: "Minibar", value: "Minibar" },
                    { label: "Phòng tắm riêng", value: "Phòng tắm riêng" },
                    { label: "Bàn làm việc", value: "Bàn làm việc" },
                    { label: "Két sắt", value: "Két sắt" },
                    { label: "Máy sấy tóc", value: "Máy sấy tóc" },
                  ]}
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
                      <div className="mt-2">Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Gallery Images">
                {/* Existing images */}
                {existingExtras.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-2">
                      Existing images:
                    </div>
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
                  New images to upload: {fileList.length}
                </div>
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Update Room Type
              </Button>
              <Link to="/admin/roomtypes">
                <Button size="large">Cancel</Button>
              </Link>
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RoomTypeEdit;
