import { Button, Card, Form, Input, message } from "antd";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import QuillEditor from "@/components/common/QuillEditor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomTypeById, updateRoomType } from "@/services/roomTypeApi";
import { useNavigate, useParams } from "react-router-dom";

const RoomTypeEdit = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["roomtype", id],
    queryFn: () => getRoomTypeById(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({ name: data.name, description: data.description });
  }, [data, form]);

  const updateMut = useMutation({
    mutationFn: (args: {
      id: string | undefined;
      payload: { name: string; description: string };
    }) => updateRoomType(args.id as string, args.payload),
    onSuccess: () => {
      message.success("Room type updated");
      queryClient.invalidateQueries({ queryKey: ["room_types"] });
      navigate("/admin/roomtypes");
    },
    onError: () => message.error("Failed to update"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4">EDIT ROOM TYPE</h2>
        <Link to="/admin/roomtypes">
          <Button type="primary">Back</Button>
        </Link>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMut.mutate({ id, payload: values })}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            valuePropName="value"
          >
            <QuillEditor />
          </Form.Item>
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

export default RoomTypeEdit;
