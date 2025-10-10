import { instance } from "@/services/api";
import { EditOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Popconfirm, Table, message } from "antd";
import { Link } from "react-router-dom";

const Branches = () => {
  const queryClient = useQueryClient();

  // 🟢 Lấy danh sách chi nhánh
  const {
    data: branches,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await instance.get("/branches");
      return response.data;
    },
  });

  // 🔴 Xóa chi nhánh
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await instance.delete(`/branches/${id}`);
    },
    onSuccess: () => {
      message.success("Branch deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading branches</div>;

  // 🧩 Cấu hình bảng hiển thị
  const columns = [
    {
      title: "ID Branch",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Action",
      key: "action",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, branch: any) => (
        <div className="flex gap-2">
          <Link to={`edit/${branch.id}`}>
            <Button type="primary" icon={<EditOutlined />}>
              Edit
            </Button>
          </Link>
          <Popconfirm
            title="Delete Branch"
            description="Are you sure to delete this branch?"
            onConfirm={() => deleteMutation.mutate(branch.id)}
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
  const dataSource = branches?.map((branch: any) => ({
    key: branch.id,
    ...branch,
  }));

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-bold">Branches List</h1>
        <Link to="add">
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
