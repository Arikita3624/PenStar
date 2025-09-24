const Hotels = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rooms</h2>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-6 py-3">STT</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Price Per Night</th>
              <th className="px-6 py-3">Slot</th>
              <th className="px-6 py-3 text-center w-40">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">1</td>
              <td className="px-6 py-4">Hotel 1</td>
              <td className="px-6 py-4">Description 1</td>
              <td className="px-6 py-4 font-semibold text-green-600">$100</td>
              <td className="px-6 py-4">10</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Available
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Hotels;
