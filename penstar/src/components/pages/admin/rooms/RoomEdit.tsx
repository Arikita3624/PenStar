/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { getRoomById, updateRoom } from "@/services/roomService";
import { getHotels } from "@/services/hotelService";
import toast from "react-hot-toast";

interface Hotel {
  _id: string;
  name: string;
}

interface RoomForm {
  hotel_id: string;
  name: string;
  description: string;
  price_per_night: string;
  capacity: string;
  bed_count: string;
  bed_type: string;
  quantity: string;
  status: "available" | "booked" | "maintenance";
}

const RoomEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [form, setForm] = useState<RoomForm>({
    hotel_id: "",
    name: "",
    description: "",
    price_per_night: "",
    capacity: "",
    bed_count: "",
    bed_type: "Queen",
    quantity: "",
    status: "available",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelData, roomData] = await Promise.all([
          getHotels(),
          getRoomById(id!),
        ]);
        setHotels(hotelData);
        setForm({
          hotel_id: roomData.hotel_id,
          name: roomData.name,
          description: roomData.description,
          price_per_night: roomData.price_per_night.toString(),
          capacity: roomData.capacity.toString(),
          bed_count: roomData.bed_count.toString(),
          bed_type: roomData.bed_type,
          quantity: roomData.quantity.toString(),
          status: roomData.status,
        });
      } catch (err) {
        toast.error("❌ Failed to load room data");
        console.error("Error loading room data:", err);
      }
    };
    if (id) fetchData();
  }, [id]);

  const onChange = useCallback((key: keyof RoomForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    if (id) {
      getRoomById(id).then((roomData) => {
        setForm({
          hotel_id: roomData.hotel_id,
          name: roomData.name,
          description: roomData.description,
          price_per_night: roomData.price_per_night.toString(),
          capacity: roomData.capacity.toString(),
          bed_count: roomData.bed_count.toString(),
          bed_type: roomData.bed_type,
          quantity: roomData.quantity.toString(),
          status: roomData.status,
        });
      });
    }
  }, [id]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!form.hotel_id) errors.push("Hotel is required");
    if (!form.name) errors.push("Room name is required");
    if (!form.price_per_night || Number(form.price_per_night) <= 0)
      errors.push("Price per night must be a positive number");
    if (!form.capacity || Number(form.capacity) <= 0)
      errors.push("Capacity must be a positive number");
    if (!form.bed_count || Number(form.bed_count) <= 0)
      errors.push("Bed count must be a positive number");
    if (!form.quantity || Number(form.quantity) <= 0)
      errors.push("Quantity must be a positive number");

    return errors;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      toast.error(`⚠️ ${errors.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (id) {
        const updatedRoom = await updateRoom(id, {
          ...form,
          price_per_night: Number(form.price_per_night),
          capacity: Number(form.capacity),
          bed_count: Number(form.bed_count),
          quantity: Number(form.quantity),
        });
        toast.success("🎉 Room updated successfully!");
        navigate("/admin/rooms");
      }
    } catch (error) {
      toast.error("🚨 Failed to update room");
      console.error("Failed to update room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Edit Room</h2>
        <a href="/admin/rooms">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Back to List
          </button>
        </a>
      </div>

      <form onSubmit={handleUpdate} className="grid gap-5 sm:grid-cols-2">
        {/* Hotel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hotel
          </label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.hotel_id}
            onChange={(e) => onChange("hotel_id", e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">— Select Hotel —</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Name
          </label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Deluxe Double, Suite…"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Room description…"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Per Night (VND)
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.price_per_night}
            onChange={(e) => onChange("price_per_night", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.capacity}
            onChange={(e) => onChange("capacity", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Bed Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Count
          </label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bed_count}
            onChange={(e) => onChange("bed_count", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Bed Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bed Type
          </label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bed_type}
            onChange={(e) => onChange("bed_type", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Queen">Queen</option>
            <option value="King">King</option>
            <option value="Twin">Twin</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.quantity}
            onChange={(e) => onChange("quantity", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.status}
            onChange={(e) => onChange("status", e.target.value)}
            disabled={isSubmitting}
          >
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Reset
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-md text-white ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomEdit;
