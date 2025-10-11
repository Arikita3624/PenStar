import { instance } from "@/services/api";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, message, Popconfirm, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import type { Room } from "@/types/room";
import { getRooms } from "@/services/roomsApi";
import { getFloors } from "@/services/floorsApi";
import { getRoomTypes } from "@/services/roomTypeApi";

const Rooms = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const {
    data: rooms,
    isLoading,
    isError,
  } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: floors } = useQuery({
    queryKey: ["floors"],
    queryFn: getFloors,
  });
  console.log(floors);

  const { data: room_types } = useQuery({
    queryKey: ["room_types"],
    queryFn: getRoomTypes,
  });

  console.log(room_types);

  const { mutate } = useMutation({
    mutationFn: async (id: number) => {
      const response = await instance.delete(`/rooms/${id}`);
      return response.data;
    },
    onSuccess: () => {
      messageApi.success("Room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      messageApi.error("Failed to delete room");
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const columns: ColumnsType<Room> = [
    {
      title: "STT",
      key: "stt",
      render: (_value, _record, index) =>
        index + 1 + (currentPage - 1) * pageSize,
      width: 80,
    },
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumbnail) => <img src={thumbnail} width={50} alt="" />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Type",
      dataIndex: "type_id",
      key: "type_id",
      render: (type_id) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        room_types?.find((type: any) => type.id === type_id)?.name || "N/A",
    },
    {
      title: "Floor",
      dataIndex: "floor_id",
      key: "floor_id",
      render: (floor_id) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        floors?.find((floor: any) => floor.id === floor_id)?.name || "N/A",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Action",
      key: "action",
      render: (_, room) => (
        <div className="flex gap-2">
          <Link to={`edit/${room.id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
          <Popconfirm
            title="Delete"
            description="Are you sure to delete this room?"
            onConfirm={() => mutate(room.id)}
          >
            <Button type="primary" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold">Rooms List</h1>
        <Link to={`add`}>
          <Button type="primary">Create</Button>
        </Link>
      </div>
      <Table
        columns={columns}
        dataSource={rooms}
        rowKey="id"
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
