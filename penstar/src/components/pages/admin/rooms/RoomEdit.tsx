/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useQuery } from "@tanstack/react-query";
import QuillEditor from "@/components/common/QuillEditor";
import { getRoomID, updateRoom } from "@/services/roomsApi";
import { uploadRoomImage } from "@/services/roomImagesApi";
import { getRoomTypes } from "@/services/roomTypeApi";
import { getFloors } from "@/services/floorsApi";
import { getImagesByRoom, deleteRoomImage } from "@/services/roomImagesApi";
import type { RoomImage } from "@/types/roomImage";
import type { RoomType } from "@/types/roomtypes";
import type { Floors } from "@/types/floors";
import type { RcFile } from "antd/lib/upload";

type FileWithMeta = RcFile & { lastModified?: number };

const RoomEdit = () => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const [thumbFile, setThumbFile] = useState<RcFile | null>(null);
  const [existingThumbUrl, setExistingThumbUrl] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [existingExtras, setExistingExtras] = useState<RoomImage[]>([]);
  const extrasKeySetRef = useRef<Set<string>>(new Set());
  const previewsRef = useRef<Record<string, string>>({});
  // refs for managing previews and dedupe
  const { id } = useParams();
  const navigate = useNavigate();

  // helper to get filename from URL (used in multiple places)
  const filenameFromUrl = (url: string) => {
    try {
      const p = new URL(url);
      return decodeURIComponent(p.pathname.split("/").pop() || "");
    } catch {
      return url.split("/").pop() || url;
    }
  };

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ["roomtypes"],
    queryFn: getRoomTypes,
  });

  const { data: floors = [], isLoading: floorsLoading } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });

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
            short_desc: data.short_desc,
            long_desc: data.long_desc,
            status: data.status,
          });
          setExistingThumbUrl(data.thumbnail || null);
          // fetch existing extras
          try {
            const imgs = await getImagesByRoom(Number(id));
            // helper to get filename from URL
            const filenameFromUrl = (url: string) => {
              try {
                const p = new URL(url);
                return decodeURIComponent(p.pathname.split("/").pop() || "");
              } catch {
                return url.split("/").pop() || url;
              }
            };

            // helper to get filename from URL (reused)

            // filter out thumbnail image from extras list if any (either flagged or same filename)
            const thumbName = data.thumbnail
              ? filenameFromUrl(data.thumbnail)
              : null;
            const extras = imgs.filter((im: RoomImage) => {
              if (im.is_thumbnail) return false;
              if (!im.image_url) return false;
              if (thumbName) {
                const imName = filenameFromUrl(im.image_url);
                if (imName === thumbName) return false;
              }
              return true;
            });
            setExistingExtras(extras);
            // populate dedupe key set for existing images (id-based and filename-based)
            extras.forEach((im) => {
              const key = `existing-${im.id}`;
              extrasKeySetRef.current.add(key);
              const fname = filenameFromUrl(im.image_url);
              if (fname) extrasKeySetRef.current.add(`name:${fname}`);
            });
          } catch (e) {
            console.error("Failed to load existing images", e);
          }
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
    // clear previews for uploaded files
    setPreviews((p) => {
      const copy = { ...p };
      Object.keys(copy).forEach((k) => {
        if (!k.startsWith("existing-")) {
          if (copy[k]) URL.revokeObjectURL(copy[k]);
          delete copy[k];
        }
      });
      return copy;
    });
    // refresh existing images and thumbnail from server to avoid duplicates/view drift
    try {
      const imgs = await getImagesByRoom(Number(roomId));
      // fetch updated room to get thumbnail field
      const room = await getRoomID(Number(roomId));
      const thumbName = room?.thumbnail
        ? filenameFromUrl(room.thumbnail)
        : null;
      const extras = imgs.filter((im: RoomImage) => {
        if (im.is_thumbnail) return false;
        if (!im.image_url) return false;
        if (thumbName) {
          const imName = filenameFromUrl(im.image_url);
          if (imName === thumbName) return false;
        }
        return true;
      });
      setExistingThumbUrl(room?.thumbnail || null);
      setExistingExtras(extras);
      // rebuild dedupe key set
      extrasKeySetRef.current.clear();
      extras.forEach((im) => {
        const key = `existing-${im.id}`;
        extrasKeySetRef.current.add(key);
        const fname = filenameFromUrl(im.image_url);
        if (fname) extrasKeySetRef.current.add(`name:${fname}`);
      });
    } catch (e) {
      console.warn("Failed to refresh images after upload", e);
    }
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">SỬA PHÒNG</h2>
        <Link to="/admin/rooms">
          <Button type="primary">Quay lại</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!id) return;
            // Build payload but be careful with thumbnail:
            // - if user selected a new thumbFile, let uploadSelectedFiles set the thumbnail after update
            // - if user did NOT select a new thumbFile, preserve existingThumbUrl (or null if they removed it)
            const payload = {
              ...values,
              type_id: values.type_id ? Number(values.type_id) : undefined,
              floor_id: values.floor_id ? Number(values.floor_id) : undefined,
              // price removed, now taken from room_types
            } as Record<string, unknown>;

            if (!thumbFile) {
              // no new thumbnail file: explicitly include current state (string or null)
              // this prevents the update from accidentally setting thumbnail to NULL when omitted
              payload.thumbnail = existingThumbUrl ?? null;
            } else {
              // new file will be uploaded after update; avoid sending thumbnail field so DB isn't overwritten
              // do nothing here
            }

            try {
              await updateRoom(Number(id), payload);
              await uploadSelectedFiles(Number(id));
              message.success("Cập nhật phòng thành công");
              navigate("/admin/rooms");
            } catch (e: any) {
              console.error("Failed to update room:", e);
              const errorMsg =
                e?.response?.data?.message || "Cập nhật phòng thất bại";
              message.error(errorMsg);
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
                    {types.map((t: RoomType) => (
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
                    {floors.map((f: Floors) => (
                      <Select.Option key={f.id} value={f.id}>
                        {f.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              {/* Price input removed, now managed in room type */}
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn trạng thái">
                  <Select.Option value="available">Còn trống</Select.Option>
                  <Select.Option value="booked">Đã đặt</Select.Option>
                  <Select.Option value="occupied">Đang ở</Select.Option>
                  <Select.Option value="unavailable">
                    Không khả dụng
                  </Select.Option>
                  <Select.Option value="cleaning">Đang dọn</Select.Option>
                </Select>
              </Form.Item>
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
                    const f = file as RcFile & { lastModified?: number };
                    // If this file is already present in pending extras, remove it to avoid duplicate
                    const key = `${f.name}-${f.size}-${f.lastModified ?? 0}`;
                    setFileList((prev) =>
                      prev.filter((p) => {
                        const pLast = (p as FileWithMeta).lastModified ?? 0;
                        const pKey = `${p.name}-${p.size}-${pLast}`;
                        return pKey !== key;
                      })
                    );
                    setPreviews((p) => {
                      const copy = { ...p } as Record<string, string>;
                      if (copy[key]) {
                        URL.revokeObjectURL(copy[key]);
                        delete copy[key];
                      }
                      return copy;
                    });
                    setThumbFile(f);
                    setPreviews((p) => ({
                      ...p,
                      thumb: URL.createObjectURL(f),
                    }));
                    return false;
                  }}
                  onRemove={async () => {
                    // If user removes a newly selected file, just clear it.
                    if (thumbFile) {
                      setThumbFile(null);
                      setPreviews((p) => {
                        const copy = { ...p } as Record<string, string>;
                        if (copy.thumb) URL.revokeObjectURL(copy.thumb);
                        delete copy.thumb;
                        return copy;
                      });
                      return true;
                    }

                    // If removing existing thumbnail (already uploaded), delete the image record on server
                    try {
                      if (existingThumbUrl && id) {
                        const imgs = await getImagesByRoom(Number(id));
                        const match = imgs.find(
                          (im: RoomImage) =>
                            im.image_url === existingThumbUrl ||
                            filenameFromUrl(im.image_url) ===
                              filenameFromUrl(existingThumbUrl)
                        );
                        if (match) {
                          await deleteRoomImage(match.id);
                          // remove dedupe keys related to this image
                          extrasKeySetRef.current.delete(
                            `existing-${match.id}`
                          );
                          try {
                            const fname = filenameFromUrl(match.image_url);
                            if (fname)
                              extrasKeySetRef.current.delete(`name:${fname}`);
                          } catch (e) {
                            void e;
                          }
                        }
                      }
                    } catch (e) {
                      console.error(
                        "Failed to delete existing thumbnail on remove:",
                        e
                      );
                    }

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
                  {/* Only show upload button when there's no existing thumbnail and no newly selected file */}
                  {!thumbFile && !existingThumbUrl && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-2xl">+</div>
                      <div>Tải ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Ảnh bổ sung (không bắt buộc)">
                {/* Upload control remains for selecting new files */}
                <Upload
                  accept="image/*"
                  listType="picture-card"
                  multiple
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const f = file as RcFile & { lastModified?: number };
                    const key = `${f.name}-${f.size}-${f.lastModified ?? 0}`;
                    // prevent adding if it's already selected as thumbnail
                    if (thumbFile) {
                      const tLast =
                        (thumbFile as FileWithMeta).lastModified ?? 0;
                      const tKey = `${thumbFile.name}-${thumbFile.size}-${tLast}`;
                      if (tKey === key) {
                        message.info(
                          "This image is already selected as the thumbnail."
                        );
                        return false;
                      }
                    }
                    // also check filename-based keys from existing images
                    if (
                      extrasKeySetRef.current.has(key) ||
                      extrasKeySetRef.current.has(`name:${f.name}`)
                    ) {
                      // duplicate, skip adding
                      message.info("This image is already selected or exists.");
                      return false;
                    }
                    extrasKeySetRef.current.add(key);
                    setFileList((prev) => [...prev, f]);
                    const url = URL.createObjectURL(f);
                    setPreviews((p) => ({ ...p, [key]: url }));
                    return false;
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-2xl">+</div>
                    <div>Tải ảnh</div>
                  </div>
                </Upload>

                <div className="text-xs text-gray-500 mt-2">
                  Đã chọn (chờ tải lên): {fileList.length} ảnh
                </div>

                {/* Gallery: render both existing extras (from server) and newly selected files */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {existingExtras.map((im) => (
                    <div key={`existing-${im.id}`} className="relative">
                      <img
                        src={im.image_url}
                        alt={`extra-${im.id}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                        onClick={async () => {
                          // call delete API then remove from UI
                          try {
                            await deleteRoomImage(im.id);
                            setExistingExtras((prev) =>
                              prev.filter((p) => p.id !== im.id)
                            );
                            // remove dedupe keys (both id-based and filename-based)
                            extrasKeySetRef.current.delete(`existing-${im.id}`);
                            try {
                              const urlParts = im.image_url.split("/");
                              const fname = decodeURIComponent(
                                urlParts[urlParts.length - 1] || ""
                              );
                              if (fname)
                                extrasKeySetRef.current.delete(`name:${fname}`);
                            } catch (e) {
                              console.warn(
                                "Failed to remove filename dedupe key",
                                e
                              );
                            }
                            message.success("Image deleted");
                          } catch (e) {
                            console.error(e);
                            message.error("Failed to delete image");
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {fileList.map((f) => {
                    const last = (f as FileWithMeta).lastModified ?? 0;
                    const key = `${f.name}-${f.size}-${last}`;
                    return (
                      <div key={key} className="relative">
                        <img
                          src={previews[key]}
                          alt={f.name}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                          onClick={() => {
                            // remove pending file (same logic as Upload onRemove)
                            extrasKeySetRef.current.delete(key);
                            setFileList((prev) =>
                              prev.filter((p) => {
                                const pLast =
                                  (p as FileWithMeta).lastModified ?? 0;
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
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Form.Item>
            </div>
          </div>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RoomEdit;
