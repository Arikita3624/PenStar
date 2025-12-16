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
} from "antd";
import QuillEditor from "@/components/common/QuillEditor";
import { useQuery } from "@tanstack/react-query";
import { createRoom } from "@/services/roomsApi";
import { uploadRoomImage } from "@/services/roomImagesApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import type { RcFile } from "antd/lib/upload";
import type { RoomType } from "@/types/roomtypes";
import type { Floors as Floor } from "@/types/floors";
type FileWithMeta = RcFile & { lastModified?: number };

const RoomAdd: React.FC = () => {
  const [form] = Form.useForm();
  const [extras, setExtras] = useState<RcFile[]>([]);
  const [thumb, setThumb] = useState<RcFile | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  // use react-query like RoomEdit to fetch room types and floors
  const { data: roomTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  const { data: floors = [], isLoading: floorsLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  // room types and floors are fetched by react-query above

  const uploadSelectedFiles = async (roomId: number) => {
    if (thumb) {
      try {
        await uploadRoomImage(roomId, thumb, true);
      } catch (e) {
        console.error("Upload failed for thumb", e);
      }
      setThumb(null);
    }

    if (extras.length > 0) {
      for (const f of extras) {
        try {
          await uploadRoomImage(roomId, f, false);
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
      {/* use global message so notifications persist across navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">THÊM PHÒNG</h2>
        <Link to="/admin/rooms">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            // ensure required fields exist and types are correct for backend Joi validation
            const PLACEHOLDER_THUMBNAIL =
              "https://via.placeholder.com/800x600?text=No+Image";
            const payload = {
              name: values.name ?? "",
              type_id: values.type_id ? Number(values.type_id) : undefined,
              floor_id: values.floor_id ? Number(values.floor_id) : undefined,
              // price removed, now taken from room_types
              short_desc: values.short_desc ?? "",
              long_desc: values.long_desc ?? "",
              // backend validation requires status and thumbnail on create
              status: "available",
              // placeholder thumbnail URL; upload will replace this after creation
              thumbnail: PLACEHOLDER_THUMBNAIL,
            } as Record<string, unknown>;

            console.log("Creating room with payload:", payload);

            try {
              const created = await createRoom(payload);
              const roomId = created && (created as { id?: number }).id;
              if (roomId) await uploadSelectedFiles(roomId);
              message.success("Tạo phòng thành công");
              navigate("/admin/rooms");
            } catch (err) {
              // surface server-side validation message if available
              const e = err as { response?: { data?: { message?: string } } };
              const serverMsg = e?.response?.data?.message;
              console.error("Error creating room:", e, serverMsg ?? "");
              message.error(serverMsg ?? "Tạo phòng thất bại");
            }
          }}
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Form.Item
                name="name"
                label="Tên phòng"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="type_id"
                  label="Loại phòng"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn loại phòng" loading={typesLoading}>
                    {roomTypes.map((t: RoomType) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="floor_id"
                  label="Tầng"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Chọn tầng" loading={floorsLoading}>
                    {floors.map((f: Floor) => (
                      <Select.Option key={f.id} value={f.id}>
                        {f.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Price input removed, now managed in room type */}

              <Form.Item
                name="short_desc"
                label="Mô tả ngắn"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item
                name="long_desc"
                label="Mô tả chi tiết"
                valuePropName="value"
              >
                <QuillEditor />
              </Form.Item>
            </div>

            <div className="col-span-4">
              <Form.Item label="Ảnh đại diện">
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
                      <div>Tải ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Ảnh bổ sung (không bắt buộc)">
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
                    <div>Tải ảnh</div>
                  </div>
                </Upload>

                <div className="text-xs text-gray-500 mt-2">
                  Đã chọn: {extras.length} ảnh
                </div>
              </Form.Item>
            </div>
          </div>

          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Tạo mới
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RoomAdd;
