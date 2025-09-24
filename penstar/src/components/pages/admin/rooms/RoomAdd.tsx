/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { addRoom } from "@/services/roomService";
import { getHotels } from "@/services/hotelService";
import toast from "react-hot-toast";

const RoomAdd = () => {
  const [hotels, setHotels] = useState<any[]>([]);
  const [form, setForm] = useState({
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

  useEffect(() => {
    getHotels()
      .then((data: any) => setHotels(data))
      .catch((err: any) => console.error("❌ Error loading hotels:", err));
  }, []);

  const onChange = (k: string, v: string | number) =>
    setForm((s) => ({ ...s, [k]: v }));

  const resetForm = () =>
    setForm({
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.hotel_id || !form.name || !form.description) {
      toast.error("⚠️ Please fill in all required fields!");
      return;
    }

    try {
      const newRoom = await addRoom({
        ...form,
        price_per_night: Number(form.price_per_night),
        capacity: Number(form.capacity),
        bed_count: Number(form.bed_count),
        quantity: Number(form.quantity),
      });

      console.log("✅ Room added:", newRoom);
      toast.success("🎉 Room added successfully!");
      resetForm();
    } catch (error: any) {
      console.error("❌ Failed to add room:", error);
      toast.error("🚨 Error while adding room!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-5">Add Room</h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
        {/* Hotel */}
        <div>
          <label className="block text-sm font-medium mb-1">Hotel</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.hotel_id}
            onChange={(e) => onChange("hotel_id", e.target.value)}
            required
          >
            <option value="">— Select —</option>
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Room Name</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Deluxe Double, Suite…"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Mô tả phòng…"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Price Per Night (VND)
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.price_per_night}
            onChange={(e) => onChange("price_per_night", e.target.value)}
            required
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.capacity}
            onChange={(e) => onChange("capacity", e.target.value)}
            required
          />
        </div>

        {/* Bed Count */}
        <div>
          <label className="block text-sm font-medium mb-1">Bed Count</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bed_count}
            onChange={(e) => onChange("bed_count", e.target.value)}
            required
          />
        </div>

        {/* Bed Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Bed Type</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bed_type}
            onChange={(e) => onChange("bed_type", e.target.value)}
          >
            <option>Single</option>
            <option>Double</option>
            <option>Queen</option>
            <option>King</option>
            <option>Twin</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.quantity}
            onChange={(e) => onChange("quantity", e.target.value)}
            required
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.status}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomAdd;
