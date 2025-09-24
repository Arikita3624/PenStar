const Rooms = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rooms</h2>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-6 py-3">#</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Price / Night</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">1</td>
              <td className="px-6 py-4">Room 101</td>
              <td className="px-6 py-4">Deluxe Double, City View</td>
              <td className="px-6 py-4 font-semibold text-green-600">$100</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Available
                </span>
              </td>
            </tr>

            <tr className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">2</td>
              <td className="px-6 py-4">Room 102</td>
              <td className="px-6 py-4">Standard Single</td>
              <td className="px-6 py-4 font-semibold text-gray-600">$70</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Booked
                </span>
              </td>
            </tr>

            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">3</td>
              <td className="px-6 py-4">Room 103</td>
              <td className="px-6 py-4">Suite, Ocean View</td>
              <td className="px-6 py-4 font-semibold text-yellow-600">$200</td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                  Maintenance
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rooms;
