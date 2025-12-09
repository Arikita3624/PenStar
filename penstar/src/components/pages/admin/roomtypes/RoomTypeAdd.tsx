import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Upload,
  Row,
  Col,
} from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { useQueryClient } from "@tanstack/react-query";
import { createRoomType } from "@/services/roomTypeApi";
import { uploadRoomTypeImage } from "@/services/roomTypeImagesApi";
import type { RcFile } from "antd/lib/upload";
type FileWithMeta = RcFile & { lastModified?: number };

const RoomTypeAdd: React.FC = () => {
  const [form] = Form.useForm();
  const [extras, setExtras] = useState<RcFile[]>([]);
  const [thumb, setThumb] = useState<RcFile | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const uploadSelectedFiles = async (roomTypeId: number) => {
    if (thumb) {
      try {
        await uploadRoomTypeImage(roomTypeId, thumb, true);
      } catch (e) {
        console.error("Upload failed for thumb", e);
      }
      setThumb(null);
    }

    if (extras.length > 0) {
      for (const f of extras) {
        try {
          await uploadRoomTypeImage(roomTypeId, f, false);
        } catch (e) {
          console.error("Upload failed for extra", e);
        }
      }
    }

    setExtras([]);
    setPreviews({});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">NEW ROOM TYPE</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const PLACEHOLDER_THUMBNAIL =
              "https://via.placeholder.com/800x600?text=No+Image";
            const payload = {
              name: values.name ?? "",
              description: values.description ?? "",
              thumbnail: PLACEHOLDER_THUMBNAIL,
              amenities: values.amenities || [],
              capacity: values.capacity ? Number(values.capacity) : 2,
              max_adults: values.max_adults ? Number(values.max_adults) : 2,
              max_children: values.max_children
                ? Number(values.max_children)
                : 1,
              price: values.price ? Number(values.price) : 0,
              bed_type: values.bed_type,
              view_direction: values.view_direction,
              safety_info: values.safety_info,
              room_size: values.room_size
                ? Number(values.room_size)
                : undefined,
              floor_material: values.floor_material,
              devices: values.devices || [],
            };

            try {
              const created = await createRoomType(payload);
              const roomTypeId = created && (created as { id?: number }).id;
              if (roomTypeId) await uploadSelectedFiles(roomTypeId);
              message.success("Room type created successfully");
              queryClient.invalidateQueries({ queryKey: ["room_types"] });
              navigate("/admin/roomtypes");
            } catch (err) {
              const e = err as { response?: { data?: { message?: string } } };
              const serverMsg = e?.response?.data?.message;
              console.error("Error creating room type:", e, serverMsg ?? "");
              message.error(serverMsg ?? "Failed to create room type");
            }
          }}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input placeholder="Enter room type name (e.g., Deluxe, Suite)" />
              </Form.Item>

              <div className="grid grid-cols-4 gap-4">
                <Form.Item
                  name="price"
                  label="Price (VND)"
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
                  label="Capacity"
                  rules={[{ required: true }]}
                  tooltip="Tổng số người tối đa (người lớn + trẻ em)"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="2"
                  />
                </Form.Item>
                <Form.Item
                  name="max_adults"
                  label="Max Adults"
                  rules={[{ required: true }]}
                  tooltip="Số người lớn tối đa"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    placeholder="2"
                  />
                </Form.Item>
                <Form.Item
                  name="max_children"
                  label="Max Children"
                  rules={[{ required: true }]}
                  tooltip="Số trẻ em tối đa"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="1"
                  />
                </Form.Item>
                {/* Base Occupancy removed */}
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="bed_type" label="Bed Type">
                  <Select placeholder="Select bed type">
                    <Select.Option value="single">Single Bed</Select.Option>
                    <Select.Option value="double">Double Bed</Select.Option>
                    <Select.Option value="queen">Queen Bed</Select.Option>
                    <Select.Option value="king">King Bed</Select.Option>
                    <Select.Option value="twin">Twin Beds</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="view_direction" label="View Direction">
                  <Select placeholder="Select view">
                    <Select.Option value="sea">Sea View</Select.Option>
                    <Select.Option value="city">City View</Select.Option>
                    <Select.Option value="mountain">
                      Mountain View
                    </Select.Option>
                    <Select.Option value="garden">Garden View</Select.Option>
                    <Select.Option value="pool">Pool View</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="room_size" label="Room Size (m²)">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    placeholder="25"
                  />
                </Form.Item>

                <Form.Item name="floor_material" label="Floor Material">
                  <Select placeholder="Select floor material">
                    <Select.Option value="carpet">Carpet</Select.Option>
                    <Select.Option value="wood">Wooden Floor</Select.Option>
                    <Select.Option value="tile">Tile</Select.Option>
                    <Select.Option value="marble">Marble</Select.Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item name="safety_info" label="Safety Information">
                <Input.TextArea
                  rows={2}
                  placeholder="Fire extinguisher, smoke detector, first aid kit..."
                />
              </Form.Item>

              <Form.Item name="devices" label="Devices & Equipment">
                <Select
                  mode="tags"
                  placeholder="Type device name and press Enter"
                  style={{ width: "100%" }}
                  options={[
                    { label: "TV", value: "TV" },
                    { label: "Air Conditioner", value: "Air Conditioner" },
                    { label: "Refrigerator", value: "Refrigerator" },
                    { label: "Electric Kettle", value: "Electric Kettle" },
                    { label: "Hair Dryer", value: "Hair Dryer" },
                    { label: "Safe Box", value: "Safe Box" },
                    { label: "Telephone", value: "Telephone" },
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
                    thumb
                      ? [
                          {
                            uid: "thumb",
                            name: thumb.name,
                            status: "done",
                            originFileObj: thumb,
                            url: previews.thumb,
                          },
                        ]
                      : []
                  }
                  beforeUpload={(file) => {
                    const f = file as RcFile;
                    setThumb(f);
                    setPreviews((p) => ({
                      ...p,
                      thumb: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={() => {
                    setThumb(null);
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy.thumb) URL.revokeObjectURL(copy.thumb);
                      delete copy.thumb;
                      return copy;
                    });
                    return true;
                  }}
                >
                  {!thumb && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-2xl">+</div>
                      <div>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Additional images (extras)">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  multiple
                  fileList={extras.map((f, i) => ({
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
                    setExtras((prev) => {
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
                    const originLast = origin
                      ? (origin as FileWithMeta).lastModified
                      : (file as FileWithMeta).lastModified;
                    const key = origin
                      ? `${origin.name}-${origin.size}-${originLast}`
                      : `${file.name}-${file.size}-${originLast}`;
                    setExtras((prev) =>
                      prev.filter(
                        (p) =>
                          !(
                            p.name === (origin?.name ?? file.name) &&
                            p.size === (origin?.size ?? file.size) &&
                            (p as FileWithMeta).lastModified === originLast
                          )
                      )
                    );
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy[key]) URL.revokeObjectURL(copy[key]);
                      delete copy[key];
                      return copy;
                    });
                    return true;
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-2xl">+</div>
                    <div>Upload</div>
                  </div>
                </Upload>

                <div className="text-xs text-gray-500 mt-2">
                  Selected: {extras.length} file(s)
                </div>
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Create Room Type
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

export default RoomTypeAdd;
