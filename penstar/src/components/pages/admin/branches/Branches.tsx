import { instance } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Button, Popconfirm, Table } from "antd";
import { Link } from "react-router-dom";

const Branches = () => {
  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await instance.get("/branches");
      return res.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataSource = branches?.map((branches: any) => ({
    key: branches.id,
    ...branches,
  }));

  const columns = [
    { title: "STT", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "City", dataIndex: "city", key: "city" },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: { id: number }) => (
        <div className="flex gap-2">
          <Link to={`edit/${record.id}`}>
            <Button type="primary">Edit</Button>
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

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold">Branches</h1>
        <Link to={`add`}>
          <Button type="primary">Create</Button>
        </Link>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default Branches;
