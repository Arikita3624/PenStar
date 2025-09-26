/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLocationById, updateLocation } from "@/services/locationService";
import toast from "react-hot-toast";

interface LocationForm {
  name: string;
  address: string;
  description: string;
}

const LocationEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<LocationForm>({
    name: "",
    address: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const locationData = await getLocationById(id!);
        setForm({
          name: locationData.name,
          address: locationData.address,
          description: locationData.description,
        });
      } catch (err) {
        toast.error("❌ Failed to load location data");
        console.error("Error loading location data:", err);
      }
    };
    if (id) fetchData();
  }, [id]);

  const onChange = useCallback((key: keyof LocationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    if (id) {
      getLocationById(id).then((locationData) => {
        setForm({
          name: locationData.name,
          address: locationData.address,
          description: locationData.description,
        });
      });
    }
  }, [id]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!form.name) errors.push("Location name is required");
    if (!form.address) errors.push("Address is required");

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
        const updatedLocation = await updateLocation(id, form);
        toast.success("🎉 Location updated successfully!");
        navigate("/admin/locations");
      }
    } catch (error) {
      toast.error("🚨 Failed to update location");
      console.error("Failed to update location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Edit Location</h2>
        <a href="/admin/locations">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Back to List
          </button>
        </a>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Name
          </label>
          <input
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Downtown, Beachside…"
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
          <textarea
            rows={3}
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
            placeholder="Full address…"
            value={form.address}
            onChange={(e) => onChange("address", e.target.value)}
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
            placeholder="Location description…"
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

export default LocationEdit;
