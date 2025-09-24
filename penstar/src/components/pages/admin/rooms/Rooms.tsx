/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { getRooms } from "@/services/roomService";
import { getHotels } from "@/services/hotelService"; // Import getHotels
import toast from "react-hot-toast";

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]); // State lưu danh sách khách sạn
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi đồng thời getRooms và getHotels để tối ưu
        const [roomData, hotelData] = await Promise.all([
          getRooms(),
          getHotels(), // Lấy danh sách khách sạn
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
  const hotelMap = hotels.reduce(
    (map: { [key: string]: string }, hotel: any) => {
      map[hotel._id] = hotel.name;
      return map;
    },
    {}
  );

  if (loading) return <p className="p-6">⏳ Loading rooms...</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Rooms</h2>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
            <tr>
              <th className="px-6 py-3">STT</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Price / Night</th>
              <th className="px-6 py-3">Hotel</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room: any, idx: number) => (
              <tr key={room._id || idx} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{idx + 1}</td>
                <td className="px-6 py-4">{room.name || "—"}</td>
                <td className="px-6 py-4">{room.description || "—"}</td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  {room.price_per_night
                    ? `₫${room.price_per_night?.toLocaleString()}`
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  {hotelMap[room.hotel_id] || "—"}{" "}
                  {/* Hiển thị tên khách sạn */}
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
              </tr>
            ))}
          </tbody>
        </table>

        {rooms.length === 0 && (
          <p className="p-6 text-center text-gray-500">No rooms found.</p>
        )}
      </div>
    </div>
  );
};

export default Rooms;
