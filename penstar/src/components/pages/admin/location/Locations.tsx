const Locations = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Locations</h2>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-6 py-3">STT</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Country</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">1</td>
              <td className="px-6 py-4">Hà Nội</td>
              <td className="px-6 py-4">Vietnam</td>
              <td className="px-6 py-4">Hà Nội</td>
              <td className="px-6 py-4">Số 1 Tràng Tiền</td>
              <td className="px-6 py-4">Thủ đô Việt Nam</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Locations;
