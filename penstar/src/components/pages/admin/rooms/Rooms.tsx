/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import { getRooms } from "@/services/roomService";
import { getHotels } from "@/services/hotelService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface Room {
  _id: string;
  name: string;
  description?: string;
  price_per_night?: number;
  status: "available" | "booked" | "maintenance";
  hotel_id: string;
}

interface Hotel {
  _id: string;
  name: string;
}

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomData, hotelData] = await Promise.all([
          getRooms(),
          getHotels(),
        ]);
        setRooms(roomData);
        setHotels(hotelData);
      } catch (err) {
        toast.error("❌ Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tạo mapping từ hotel_id sang hotel_name
  const hotelMap = useMemo(() => {
    return hotels.reduce((map: { [key: string]: string }, hotel: Hotel) => {
      map[hotel._id] = hotel.name;
      return map;
    }, {});
  }, [hotels]);

  // Logic phân trang
  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">⏳ Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Rooms</h2>
        <a href="rooms/add">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Add Room
          </button>
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="px-6 py-3">STT</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Price / Night</th>
                <th className="px-6 py-3">Hotel</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.map((room: Room, idx: number) => (
                <tr key={room._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4">{room.name || "—"}</td>
                  <td className="px-6 py-4">{room.description || "—"}</td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {room.price_per_night
                      ? `₫${room.price_per_night.toLocaleString()}`
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {hotelMap[room.hotel_id] || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${
                          room.status === "available"
                            ? "bg-green-100 text-green-700"
                            : room.status === "booked"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                      {room.status || "unknown"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`edit/${room._id}`}>
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                          Edit
                        </button>
                      </Link>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rooms.length === 0 && (
          <p className="p-6 text-center text-gray-500">No rooms found.</p>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="mt-6">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Rooms per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border rounded-md px-3 py-1.5 focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md text-sm ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md text-sm ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-pink-500 text-white hover:bg-pink-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
