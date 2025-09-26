/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useMemo } from "react";
import { getHotels } from "@/services/hotelService";
import { getLocations } from "@/services/locationService"; // Giả định API để mapping location
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface Hotel {
  _id: string;
  name: string;
  address: string;
  description: string;
  email: string;
  hotline: string;
  location_id: string;
  star: number;
  created_at: string;
  updated_at: string;
}

interface Location {
  _id: string;
  name: string;
}

const Hotels = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelData, locationData] = await Promise.all([
          getHotels(),
          getLocations(),
        ]);
        setHotels(hotelData);
        setLocations(locationData);
      } catch (err) {
        toast.error("❌ Error loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const locationMap = useMemo(() => {
    return locations.reduce(
      (map: { [key: string]: string }, location: Location) => {
        map[location._id] = location.name;
        return map;
      },
      {}
    );
  }, [locations]);

  // Logic phân trang
  const totalPages = Math.ceil(hotels.length / itemsPerPage);
  const paginatedHotels = hotels.slice(
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
        <p className="text-gray-600">⏳ Loading hotels...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Hotels</h2>
        <Link to="add">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Add Hotel
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
              <tr>
                <th className="px-6 py-3">STT</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Star</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Hotline</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedHotels.map((hotel: Hotel, idx: number) => (
                <tr key={hotel._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4">{hotel.name || "—"}</td>
                  <td className="px-6 py-4">{hotel.address || "—"}</td>
                  <td className="px-6 py-4">{hotel.star || "N/A"}</td>
                  <td className="px-6 py-4">{hotel.description || "—"}</td>
                  <td className="px-6 py-4">{hotel.hotline || "—"}</td>
                  <td className="px-6 py-4">{hotel.email || "—"}</td>
                  <td className="px-6 py-4">
                    {locationMap[hotel.location_id] || "—"}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`edit/${hotel._id}`}>
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

        {hotels.length === 0 && (
          <p className="p-6 text-center text-gray-500">No hotels found.</p>
        )}
      </div>

      {hotels.length > 0 && (
        <div className="mt-6">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">
                  Hotels per page:
                </label>
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

export default Hotels;
