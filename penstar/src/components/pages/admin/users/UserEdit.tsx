import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Form, Input, Button, Select, message, Spin, Tag } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { getUsers, updateUser } from "@/services/usersApi";
import { getRoles } from "@/services/rolesApi";
import type { User } from "@/types/users";
import type { Role } from "@/types/roles";
import useAuth from "@/hooks/useAuth";

const UserEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const currentUserId = auth?.user?.id;
  const currentUserRole = auth?.getRoleName(auth.user) || "";
  const isAdmin = currentUserRole.toLowerCase() === "admin";

  // Fetch all users to get the specific user
  const { data: usersRaw, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: rolesRaw, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const users: User[] = Array.isArray(usersRaw?.data)
    ? usersRaw.data
    : (usersRaw ?? []);

  const user = users.find((u) => String(u.id) === String(id));
  const isCurrentUser = user?.id === currentUserId;

  const roles: Role[] = Array.isArray(rolesRaw)
    ? rolesRaw
    : (rolesRaw?.data ?? []);

  const roleColorMap: Record<string, string> = {
    admin: "red",
    manager: "blue",
    staff: "green",
    customer: "gold",
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<User> }) =>
      updateUser(id, data),
    onSuccess: () => {
      message.success("Cập nhật người dùng thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/admin/users");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(
        err?.response?.data?.message || "Cập nhật người dùng thất bại"
      );
    },
  });

  const handleSubmit = (values: Record<string, unknown>) => {
    if (!id) return;

    // Prepare update data
    const updateData: Partial<User> = {
      full_name: values.full_name as string,
      email: values.email as string,
      phone: values.phone as string,
    };

    // Only include role_id if admin and it changed
    if (isAdmin && values.role_id !== undefined) {
      updateData.role_id = values.role_id as number;
    }

    updateMutation.mutate({ id, data: updateData });
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg mb-4">
              Không tìm thấy người dùng
            </p>
            <Button type="primary" onClick={() => navigate("/admin/users")}>
              Quay lại danh sách
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/users")}
          >
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold m-0">Chỉnh sửa người dùng</h1>
        </div>
        {isCurrentUser && <Tag color="orange">Editing Your Own Profile</Tag>}
        {isCurrentUser && (
          <Tag color="orange">Đang chỉnh sửa hồ sơ của bạn</Tag>
        )}
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            full_name: user.full_name || "",
            email: user.email || "",
            phone: user.phone || "",
            role_id: user.role_id,
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Họ tên"
            name="full_name"
            rules={[{ required: true, message: "Please input full name" }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input email" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item label="Phone" name="phone" rules={[{ required: false }]}>
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Vai trò"
            name="role_id"
            extra={
              !isAdmin
                ? "Only admins can change roles"
                : isCurrentUser
                  ? "You cannot change your own role"
                  : null
            }
          >
            <Select
              disabled={!isAdmin || isCurrentUser}
              placeholder="Chọn vai trò"
            >
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  <Tag
                    color={roleColorMap[role.name?.toLowerCase()] || "default"}
                  >
                    {role.name}
                  </Tag>
                  <span className="ml-2">{role.description}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {isCurrentUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-yellow-800 text-sm m-0">
                ⚠️ <strong>Lưu ý:</strong> Bạn đang chỉnh sửa hồ sơ của chính
                mình. Bạn không thể thay đổi vai trò hoặc tự chặn mình.
              </p>
            </div>
          )}

          <Form.Item className="mb-0">
            <div className="flex gap-3">
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
                size="large"
              >
                Lưu thay đổi
              </Button>
              <Button size="large" onClick={() => navigate("/admin/users")}>
                Hủy
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default UserEdit;
