import { instance } from "@/services/api";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, message, Popconfirm, Table } from "antd";
import { Link } from "react-router-dom";

const Rooms = () => {
  const [massageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await instance.get("/rooms");
      return response.data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await instance.get("/branches");
      return response.data;
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (id: number | string) => {
      const response = await instance.delete(`/rooms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      massageApi.success("Room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      massageApi.error("Failed to delete room");
      console.log("Error deleting room");
    },
  });

  console.log(branches);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const columns = [
    {
      title: "STT",
      key: "stt",
      render: (_value: unknown, _record: unknown, index: number) =>
        index + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image: string) => <img src={image} width={50} alt="" />,
    },
    {
      title: "Room Number",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "Branch",
      dataIndex: "branchId",
      key: "branchId",
      render: (branchId: number | string) => {
        const branch = branches?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => String(b.id) === String(branchId)
        );
        return branch ? branch.name : "Unknown";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Action",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, rooom: any) => (
        <div className="flex gap-2">
          <Link to={`edit/${rooom.id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
          <Popconfirm
            title="Delete"
            description="Are you sure to delete this product?"
            onConfirm={() => mutate(rooom.id)}
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
  const dataSource = rooms?.map((room: any) => ({
    key: room.id,
    ...room,
  }));

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rooms List</h1>
        </div>
        <div>
          <Link to={`add`}>
            <Button type="primary">Create</Button>
          </Link>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{
          pageSize: pageSize,
          current: currentPage,
          onChange: (page) => setCurrentPage(page),
        }}
      />
    </div>
  );
};

export default Rooms;
