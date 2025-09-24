import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price_per_night: { type: Number, required: true },
    capacity: { type: Number, required: true },
    bed_count: { type: Number, required: true },
    bed_type: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
