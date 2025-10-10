import { useMutation, useQuery } from "@tanstack/react-query";
import { Input, InputNumber, message, Select, Form, Button } from "antd";
import { useNavigate } from "react-router-dom";

const RoomAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Lấy danh sách chi nhánh
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/branches");
      return res.json();
    },
  });

  // Mutation thêm phòng
  const mutation = useMutation({
    mutationFn: async (newRoom: any) => {
      const res = await fetch("http://localhost:8000/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      return res.json();
    },
    onSuccess: () => {
      message.success("Room created successfully!");
      navigate("/admin/rooms");
    },
    onError: () => {
      message.error("Failed to create room!");
    },
  });

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add New Room</h1>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Form.Item
          label="Room Number"
          name="number"
          rules={[{ required: true }]}
        >
          <Input placeholder="Enter room number" />
        </Form.Item>

        <Form.Item label="Branch" name="branchId" rules={[{ required: true }]}>
          <Select placeholder="Select branch">
            {branches?.map((b: any) => (
              <Select.Option key={b.id} value={b.id}>
                {b.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Price" name="price" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item label="Status" name="status" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="available">Available</Select.Option>
            <Select.Option value="booked">Booked</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Image"
          name="image"
          rules={[{ required: true, message: "Please provide an image URL!" }]}
        >
          <>
            <Input
              placeholder="https://..."
              onChange={(e) => form.setFieldValue("image", e.target.value)}
              addonAfter={
                <Button
                  onClick={() => {
                    const url = `https://picsum.photos/300/300?random=${Date.now()}`;
                    form.setFieldValue("image", url);
                  }}
                  type="link"
                >
                  Random
                </Button>
              }
            />
            {form.getFieldValue("image") && (
              <img
                src={form.getFieldValue("image")}
                alt="preview"
                style={{
                  marginTop: 8,
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  border: "1px solid #eee",
                  objectFit: "cover",
                }}
              />
            )}
          </>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default RoomAdd;
