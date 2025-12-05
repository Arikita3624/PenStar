import React, { useState } from "react";
import { Card, Form, Input, Button, message, Space, Typography, Divider, Tag } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, SaveOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updateUser } from "@/services/usersApi";
import useAuth from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const CustomerProfile: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: !!auth?.token,
  });

  const user = userData || auth?.user;

  const updateMutation = useMutation({
    mutationFn: (values: { full_name?: string; phone?: string }) => {
      if (!user?.id) throw new Error("User ID not found");
      return updateUser(user.id, values);
    },
    onSuccess: (data) => {
      message.success("Cập nhật thông tin thành công!");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setIsEditing(false);
      // Update auth context if needed
      if (data?.user) {
        const updatedUser = data.user;
        // Update localStorage if needed
        try {
          localStorage.setItem("penstar_user", JSON.stringify(updatedUser));
        } catch (e) {
          console.debug("Failed to update localStorage", e);
        }
      }
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Cập nhật thông tin thất bại");
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue({
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSubmit = async (values: { full_name: string; phone: string }) => {
    await updateMutation.mutateAsync({
      full_name: values.full_name,
      phone: values.phone,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Title level={4}>Không tìm thấy thông tin người dùng</Title>
            <Button type="primary" onClick={() => navigate("/signin")}>
              Đăng nhập
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Title level={2} className="mb-6">
          Thông tin tài khoản
        </Title>

        <Card className="shadow-lg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-3xl text-blue-600" />
                </div>
                <div>
                  <Title level={4} className="!mb-1">
                    {user.full_name || "Chưa có tên"}
                  </Title>
                  <Text type="secondary">
                    {user.role_name || user.role || "Customer"}
                  </Text>
                  {user.role_name && (
                    <Tag color="blue" className="ml-2">
                      {user.role_name}
                    </Tag>
                  )}
                </div>
              </div>
              {!isEditing && (
                <Button type="primary" icon={<SaveOutlined />} onClick={handleEdit}>
                  Chỉnh sửa
                </Button>
              )}
            </div>
            <Divider />
          </div>

          {isEditing ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                full_name: user.full_name || "",
                email: user.email || "",
                phone: user.phone || "",
              }}
            >
              <Form.Item
                label="Họ và tên"
                name="full_name"
                rules={[
                  { required: true, message: "Vui lòng nhập họ và tên" },
                  { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập họ và tên"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                  size="large"
                  disabled
                  className="bg-gray-100"
                />
                <Text type="secondary" className="text-xs">
                  Email không thể thay đổi
                </Text>
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại" },
                  {
                    pattern: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateMutation.isPending}
                    size="large"
                  >
                    Lưu thay đổi
                  </Button>
                  <Button size="large" onClick={handleCancel}>
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <div className="space-y-4">
              <div>
                <Text strong className="text-gray-600">
                  Họ và tên:
                </Text>
                <div className="mt-1 text-lg">{user.full_name || "Chưa cập nhật"}</div>
              </div>
              <Divider />
              <div>
                <Text strong className="text-gray-600">
                  Email:
                </Text>
                <div className="mt-1 text-lg flex items-center gap-2">
                  <MailOutlined />
                  {user.email || "Chưa cập nhật"}
                </div>
              </div>
              <Divider />
              <div>
                <Text strong className="text-gray-600">
                  Số điện thoại:
                </Text>
                <div className="mt-1 text-lg flex items-center gap-2">
                  <PhoneOutlined />
                  {user.phone || "Chưa cập nhật"}
                </div>
              </div>
              <Divider />
              <div>
                <Text strong className="text-gray-600">
                  Vai trò:
                </Text>
                <div className="mt-1">
                  <Tag color="blue">{user.role_name || user.role || "Customer"}</Tag>
                </div>
              </div>
              {user.created_at && (
                <>
                  <Divider />
                  <div>
                    <Text strong className="text-gray-600">
                      Ngày tham gia:
                    </Text>
                    <div className="mt-1">
                      {new Date(user.created_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="mt-6 shadow-lg">
          <Title level={4} className="mb-4">
            Thao tác nhanh
          </Title>
          <Space direction="vertical" className="w-full">
            <Button
              type="default"
              block
              size="large"
              onClick={() => navigate("/bookings")}
            >
              Xem đặt phòng của tôi
            </Button>
            <Button
              type="default"
              block
              size="large"
              onClick={() => navigate("/rooms")}
            >
              Tìm phòng
            </Button>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfile;

