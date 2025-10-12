import { instance } from "@/services/api";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, message, Popconfirm, Table } from "antd";
import { Link } from "react-router-dom";

const RoomTypes = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const {
    data: roomTypes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["roomTypes"],
    queryFn: async () => {
      const res = await instance.get("/room-types");
      return res.data;
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (id: number | string) => {
      const res = await instance.delete(`/room-types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      messageApi.success("Room type deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roomTypes"] });
    },
    onError: () => {
      messageApi.error("Failed to delete room type");
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading room types</div>;

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_: unknown, _record: unknown, index: number) =>
        index + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text: string) =>
        text?.length > 50 ? text.substring(0, 50) + "..." : text,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) =>
        new Date(date).toLocaleString("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      title: "Action",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, type: any) => (
        <div className="flex gap-2">
          <Link to={`edit/${type.id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
          <Popconfirm
            title="Delete"
            description="Are you sure to delete this room type?"
            onConfirm={() => mutate(type.id)}
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataSource = roomTypes?.map((item: any) => ({
    key: item.id,
    ...item,
  }));

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold">Room Types List</h1>
        <Link to={`add`}>
          <Button type="primary">Create</Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{
          pageSize,
          current: currentPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />
    </div>
  );
};

export default RoomTypes;
