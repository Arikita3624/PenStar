const Users = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Users</h2>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-6 py-3">STT</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3 text-center w-40">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">1</td>
              <td className="px-6 py-4">Nguyễn Văn A</td>
              <td className="px-6 py-4">vana@example.com</td>
              <td className="px-6 py-4">Admin</td>
              <td className="px-6 py-4">0123456789</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </td>
            </tr>

            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">2</td>
              <td className="px-6 py-4">Trần Thị B</td>
              <td className="px-6 py-4">thib@example.com</td>
              <td className="px-6 py-4">Customer</td>
              <td className="px-6 py-4">0987654321</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Banned
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
