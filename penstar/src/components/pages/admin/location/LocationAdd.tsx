/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback } from "react";
import { addLocation } from "@/services/locationService";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

interface LocationForm {
  name: string;
  address: string;
  description: string;
  status?: "active" | "inactive" | "maintenance";
}

const LocationAdd = () => {
  const [form, setForm] = useState<LocationForm>({
    name: "",
    address: "",
    description: "",
    status: "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = useCallback((key: keyof LocationForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      address: "",
      description: "",
    });
  }, []);

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
      console.log("Sending data:", form);
      const newLocation = await addLocation({
        name: form.name,
        address: form.address,
        description: form.description,
      });
      toast.success("🎉 Location added successfully!");
      resetForm();
    } catch (error: any) {
      console.error("Full error:", error);
      console.error("Server response:", error.response?.data);
      toast.error(
        `🚨 Failed to add location: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Add Location</h2>
        <Link to="/admin/locations">
          <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
            Back to List
          </button>
        </Link>
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

        <div className="sm:col-span-2 flex justify-end">
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

export default LocationAdd;
