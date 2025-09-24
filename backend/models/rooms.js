import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    capacity: { type: Number, required: true },
    bedCount: { type: Number, required: true },
    bedType: { type: String, required: true },
    status: { type: String, required: true },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
  },
  { timestamps: true }
);

const Rooms = mongoose.model("Room", roomSchema);

export default Rooms;
