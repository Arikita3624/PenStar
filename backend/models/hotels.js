import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    hotline: { type: String, required: true },
    email: { type: String, required: true },
    star: { type: Number, min: 1, max: 5, required: true },
    description: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
