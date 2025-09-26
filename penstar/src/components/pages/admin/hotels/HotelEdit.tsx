/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHotelById, updateHotel } from "@/services/hotelService";
import { getLocations } from "@/services/locationService";
import toast from "react-hot-toast";

interface Location {
  _id: string;
  name: string;
}

interface HotelForm {
  location_id: string;
  name: string;
  address: string;
  hotline: string;
  email: string;
  star: string;
  description: string;
}

const HotelEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState<HotelForm>({
    location_id: "",
    name: "",
    address: "",
    hotline: "",
    email: "",
    star: "3",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationData, hotelData] = await Promise.all([
          getLocations(),
          getHotelById(id!),
        ]);
        setLocations(locationData);
        setForm({
          location_id: hotelData.location_id,
          name: hotelData.name,
          address: hotelData.address,
          hotline: hotelData.hotline,
          email: hotelData.email,
          star: hotelData.star.toString(),
          description: hotelData.description,
        });
      } catch (err) {
        toast.error("❌ Failed to load hotel data");
        console.error("Error loading hotel data:", err);
      }
    };
    if (id) fetchData();
  }, [id]);

  const onChange = useCallback((key: keyof HotelForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    if (id) {
      getHotelById(id).then((hotelData) => {
        setForm({
          location_id: hotelData.location_id,
          name: hotelData.name,
          address: hotelData.address,
          hotline: hotelData.hotline,
          email: hotelData.email,
          star: hotelData.star.toString(),
          description: hotelData.description,
        });
      });
    }
  }, [id]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!form.location_id) errors.push("Location is required");
    if (!form.name) errors.push("Hotel name is required");
    if (!form.address) errors.push("Address is required");
    if (!form.hotline) errors.push("Hotline is required");
    if (!form.email) errors.push("Email is required");
    if (!form.star || Number(form.star) < 1 || Number(form.star) > 5)
      errors.push("Star must be between 1 and 5");

    return errors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      toast.error(`⚠️ ${errors.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (id) {
        const updatedHotel = await updateHotel(id, {
          ...form,
          star: Number(form.star),
        });
        toast.success("🎉 Hotel updated successfully!");
        navigate("/admin/hotels");
      }
    } catch (error) {
      toast.error("🚨 Failed to update hotel");
      console.error("Failed to update hotel:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Edit Hotel</h2>
        <a href="/admin/hotels">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Back to List
          </button>
        </a>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.location_id}
            onChange={(e) => onChange("location_id", e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">— Select Location —</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hotel Name
          </label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Hilton, Majestic..."
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Street, District..."
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Hotline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hotline
          </label>
          <input
            type="tel"
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="0123456789"
            value={form.hotline}
            onChange={(e) => onChange("hotline", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="hotel@example.com"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Star */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Star
          </label>
          <input
            type="number"
            min={1}
            max={5}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            value={form.star}
            onChange={(e) => onChange("star", e.target.value)}
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
            placeholder="Short description about the hotel..."
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            disabled={isSubmitting}
          />
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

export default HotelEdit;
