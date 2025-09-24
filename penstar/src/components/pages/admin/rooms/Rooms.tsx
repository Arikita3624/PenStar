/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import getRooms from "@/services/roomService";

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRooms();
        console.log("Rooms data:", data); // check log
        setRooms(data);
      } catch (err) {
        console.error("❌ Error loading rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="p-6">⏳ Loading rooms...</p>;

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
              <th className="px-6 py-3">Price / Night</th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room: any, idx: number) => (
              <tr key={room._id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{idx + 1}</td>
                <td className="px-6 py-4">{room.name}</td>
                <td className="px-6 py-4">{room.description}</td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  ${room.price_per_night.toLocaleString()}
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
                    {room.status}
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
