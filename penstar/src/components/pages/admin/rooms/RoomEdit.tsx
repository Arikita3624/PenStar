import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { getRoomID, updateRoom } from "@/services/roomsApi";
import { uploadRoomImage } from "@/services/roomImagesApi";
import type { RcFile, UploadFile } from "antd/lib/upload";

type FileWithMeta = RcFile & { lastModified?: number };

const RoomEdit = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [thumbFile, setThumbFile] = useState<RcFile | null>(null);
  const [existingThumbUrl, setExistingThumbUrl] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const extrasKeySetRef = useRef<Set<string>>(new Set());
  const previewsRef = useRef<Record<string, string>>({});
  // refs for managing previews and dedupe
  const { id } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getRoomID(Number(id));
        if (data) {
          form.setFieldsValue({
            name: data.name,
            type_id: data.type_id,
            floor_id: data.floor_id,
            capacity: data.capacity,
            price: data.price,
            short_desc: data.short_desc,
            long_desc: data.long_desc,
            status: data.status,
          });
          setExistingThumbUrl(data.thumbnail || null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, form]);

  const uploadSelectedFiles = async (roomId: number) => {
    const results: unknown[] = [];
    if (thumbFile) {
      try {
        const resThumb = await uploadRoomImage(roomId, thumbFile, true);
        results.push(resThumb);
      } catch (e) {
        console.error("Upload failed for thumb", e);
      }
      setThumbFile(null);
    }
    if (fileList && fileList.length > 0) {
      for (const f of fileList) {
        try {
          const res = await uploadRoomImage(roomId, f, false);
          results.push(res);
        } catch (e) {
          console.error("Upload failed for file", e);
        }
      }
    }
    setFileList([]);
    return results;
  };

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // (optional) file hashing could be added later for content-based dedupe

  return (
    <div>
      {contextHolder}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">EDIT ROOM</h2>
        <Link to="/admin/rooms">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!id) return;
            const payload = {
              ...values,
              type_id: values.type_id ? Number(values.type_id) : undefined,
              floor_id: values.floor_id ? Number(values.floor_id) : undefined,
              price: values.price ? Number(values.price) : undefined,
              capacity: values.capacity ? Number(values.capacity) : undefined,
            } as Record<string, unknown>;
            try {
              await updateRoom(Number(id), payload);
              await uploadSelectedFiles(Number(id));
              messageApi.success("Room updated");
              navigate("/admin/rooms");
            } catch {
              messageApi.error("Failed to update room");
            }
          }}
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              <Form.Item
                name="name"
                label="Room Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="type_id"
                  label="Room Type"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select room type" />
                </Form.Item>
                <Form.Item
                  name="floor_id"
                  label="Floor"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select floor" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="capacity"
                  label="Capacity"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="price"
                  label="Price (VND)"
                  rules={[{ required: true }]}
                >
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </div>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select status">
                  <Select.Option value="available">Available</Select.Option>
                  <Select.Option value="booked">Booked</Select.Option>
                  <Select.Option value="occupied">Occupied</Select.Option>
                  <Select.Option value="unavailable">Unavailable</Select.Option>
                  <Select.Option value="cleaning">Cleaning</Select.Option>
                  <Select.Option value="checked_out">
                    Checked-out (History)
                  </Select.Option>
                  <Select.Option value="no_show">No-show</Select.Option>
                  <Select.Option value="pending_payment">
                    Pending Payment
                  </Select.Option>
                  <Select.Option value="cancelled">Cancelled</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="short_desc"
                label="Short Description"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="long_desc"
                label="Long Description"
                valuePropName="value"
              >
                <QuillEditor />
              </Form.Item>
            </div>
            <div className="col-span-4">
              <Form.Item label="Thumbnail">
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  fileList={
                    thumbFile
                      ? [
                          {
                            uid: "thumb",
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
                            url: existingThumbUrl,
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
                    setThumbFile(null);
                    setExistingThumbUrl(null);
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy.thumb) URL.revokeObjectURL(copy.thumb);
                      delete copy.thumb;
                      return copy;
                    });
                    return true;
                  }}
                >
                  {!thumbFile && (
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
                  fileList={fileList.map((f) => {
                    const pLast = (f as FileWithMeta).lastModified ?? 0;
                    const key = `${f.name}-${f.size}-${pLast}`;
                    return {
                      uid: key,
                      name: f.name,
                      status: "done",
                      originFileObj: f,
                      url: previews[key],
                    };
                  })}
                  beforeUpload={(file) => {
                    const f = file as RcFile & { lastModified?: number };
                    const key = `${f.name}-${f.size}-${f.lastModified ?? 0}`;
                    if (extrasKeySetRef.current.has(key)) {
                      // duplicate, skip adding
                      return false;
                    }
                    extrasKeySetRef.current.add(key);
                    setFileList((prev) => [...prev, f]);
                    setPreviews((p) => ({
                      ...p,
                      [key]: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={(file) => {
                    const origin = (file as unknown as UploadFile)
                      .originFileObj as RcFile | undefined;
                    const last = origin
                      ? (origin as FileWithMeta).lastModified ?? 0
                      : (file as FileWithMeta).lastModified ?? 0;
                    const key = origin
                      ? `${origin.name}-${origin.size}-${last}`
                      : `${file.name}-${file.size}-${last}`;
                    extrasKeySetRef.current.delete(key);
                    setFileList((prev) =>
                      prev.filter((p) => {
                        const pLast = (p as FileWithMeta).lastModified ?? 0;
                        const pKey = `${p.name}-${p.size}-${pLast}`;
                        return pKey !== key;
                      })
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
                  Selected: {fileList.length} file(s)
                </div>
              </Form.Item>
            </div>
          </div>
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

export default RoomEdit;
