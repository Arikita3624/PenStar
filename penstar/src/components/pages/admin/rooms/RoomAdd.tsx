import { useState } from "react";

const RoomAdd = () => {
  // giả lập hotel list để chọn
  const hotels = [
    { id: 1, name: "Hilton Hà Nội" },
    { id: 2, name: "Majestic Sài Gòn" },
  ];

  const [form, setForm] = useState({
    hotelId: "",
    name: "",
    description: "",
    pricePerNight: "",
    capacity: 2,
    bedCount: 1,
    bedType: "Queen",
    status: "available",
  });

  const onChange = (k: string, v: string | number) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-5">Add Room</h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium mb-1">Hotel</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.hotelId}
            onChange={(e) => onChange("hotelId", e.target.value)}
          >
            <option value="">— Select —</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Room Name</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Deluxe Double, Suite…"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Mô tả phòng…"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Price Per Night ($)
          </label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.pricePerNight}
            onChange={(e) => onChange("pricePerNight", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Capacity</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.capacity}
            onChange={(e) => onChange("capacity", Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bed Count</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bedCount}
            onChange={(e) => onChange("bedCount", Number(e.target.value))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bed Type</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.bedType}
            onChange={(e) => onChange("bedType", e.target.value)}
          >
            <option>Single</option>
            <option>Double</option>
            <option>Queen</option>
            <option>King</option>
            <option>Twin</option>
          </select>
        </div>

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
          <button className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomAdd;
