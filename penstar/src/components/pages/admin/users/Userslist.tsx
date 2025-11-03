import { EditOutlined } from "@ant-design/icons";
import { Button, Card, Input, Table, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types/users";
import { getUsers } from "@/services/usersApi";
import { updateUser } from "@/services/usersApi";
import { message } from "antd";
import { getRoles } from "@/services/rolesApi";
import type { Role } from "@/types/roles";
import useAuth from "@/hooks/useAuth";

const Userlist = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUserId = auth?.user?.id;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: usersRaw, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: rolesRaw } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const roleMap = useMemo(() => {
    const src: Role[] = Array.isArray(rolesRaw)
      ? rolesRaw
      : rolesRaw?.data ?? [];
    const m: Record<number, string> = {};
    src.forEach((r) => {
      if (r && typeof r.id !== "undefined") m[Number(r.id)] = r.name;
    });
    return m;
  }, [rolesRaw]);
  // map role name -> color
  const roleColorMap: Record<string, string> = {
    admin: "red",
    manager: "blue",
    staff: "green",
    customer: "gold",
  };

  const queryClient = useQueryClient();

  const banMut = useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      updateUser(id, { status }),
    onSuccess: () => {
      message.success("User status updated");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error("Failed to update user status"),
  });

  // backend returns { success, message, data } from listUsers controller
  const users: User[] = Array.isArray(usersRaw?.data)
    ? usersRaw.data
    : usersRaw ?? [];

  const filtered = users.filter((u) => {
    const q = String(searchTerm ?? "")
      .trim()
      .toLowerCase();
    if (!q) return true;
    return (
      String(u.full_name ?? "")
        .toLowerCase()
        .includes(q) ||
      String(u.email ?? "")
        .toLowerCase()
        .includes(q) ||
      String(u.phone ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  const columns: ColumnsType<User> = [
    {
      title: "STT",
      key: "stt",
      render: (_v, _r, idx) => idx + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    { title: "Name", dataIndex: "full_name", key: "full_name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Role",
      dataIndex: "role_id",
      key: "role_id",
      render: (_unused, rec) => {
        const name = roleMap[Number(rec.role_id)] ?? String(rec.role_id ?? "-");
        const color = roleColorMap[name?.toLowerCase?.()] ?? "default";
        return <Tag color={color}>{name}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_v, record) => {
        const isCurrentUser = record.id === currentUserId;
        return (
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/users/${record.id}/edit`)}
              disabled={isCurrentUser}
            >
              Edit
            </Button>
            <Button
              type="primary"
              danger
              onClick={() =>
                banMut.mutate({
                  id: record.id,
                  status: record.status === "banned" ? "active" : "banned",
                })
              }
              disabled={isCurrentUser}
            >
              {record.status === "banned" ? "Unban" : "Ban"}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">USERS</h1>
        <div className="flex items-center gap-3">
          <Input.Search
            placeholder="Search by name or email"
            allowClear
            style={{ width: 360 }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize,
            current: currentPage,
            onChange: (p) => setCurrentPage(p),
          }}
        />
      </Card>
    </div>
  );
};

export default Userlist;
