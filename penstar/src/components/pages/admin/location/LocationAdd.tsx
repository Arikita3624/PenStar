import { useState } from "react";

const LocationAdd = () => {
  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    address: "",
    description: "",
  });

  const onChange = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Location Data:", form);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-5">Add Location</h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Hà Nội, Sài Gòn..."
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium mb-1">Country</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Vietnam"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Hà Nội / HCM / Đà Nẵng..."
            value={form.city}
            onChange={(e) => onChange("city", e.target.value)}
          />
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

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Mô tả thêm về khu vực này..."
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-end">
          <button className="px-6 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationAdd;
