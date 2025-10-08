import { EditOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Popconfirm, Table } from "antd";
import { Link } from "react-router-dom";

const Rooms = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/rooms");
      return res.json();
    },
  });

  console.log(data);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const columns = [
    {
      title: "STT",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Room Number",
      dataIndex: "number",
      key: "number",
    },
    {
      title: "branchId",
      dataIndex: "branchId",
      key: "branchId",
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
          <Link to={`${rooom.id}/edit`}>
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
  const dataSource = data?.map((room: any) => ({
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
      <Table columns={columns} dataSource={dataSource} />
    </div>
  );
};

export default Rooms;
