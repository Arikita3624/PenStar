import { useState } from "react";

const HotelAdd = () => {
  // giả lập location list để chọn
  const locations = [
    { id: 1, name: "Hà Nội" },
    { id: 2, name: "TP. Hồ Chí Minh" },
    { id: 3, name: "Đà Nẵng" },
  ];

  const [form, setForm] = useState({
    name: "",
    locationId: "",
    address: "",
    phone: "",
    email: "",
    stars: 3,
    description: "",
  });

  const onChange = (k: string, v: string | number) =>
    setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Hotel Data:", form);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-5">Add Hotel</h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
        {/* Hotel Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Hotel Name</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Hilton, Majestic..."
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.locationId}
            onChange={(e) => onChange("locationId", e.target.value)}
          >
            <option value="">— Select —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Số nhà, đường, quận..."
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="0123 456 789"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="hotel@mail.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        {/* Stars */}
        <div>
          <label className="block text-sm font-medium mb-1">Stars</label>
          <input
            type="number"
            min={1}
            max={5}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.stars}
            onChange={(e) => onChange("stars", Number(e.target.value))}
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Mô tả ngắn về khách sạn..."
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end">
          <button className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default HotelAdd;
