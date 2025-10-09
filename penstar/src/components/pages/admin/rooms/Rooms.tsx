import { instance } from "@/services/api";
import { EditOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Popconfirm, Table } from "antd";
import { Link } from "react-router-dom";

const Rooms = () => {
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

  console.log(branches);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const columns = [
    {
      title: "ID Room",
      dataIndex: "id",
      key: "id",
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
      render: (branchId: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const branch = branches?.find((b: any) => b.id === branchId);
        return branch ? branch.name : "";
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
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default Rooms;
