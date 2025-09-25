import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import roomRouter from "./routers/rooms.js";
import hotelRouter from "./routers/hotels.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

// Routes
app.use("/api/rooms", roomRouter);
app.use("/api/hotels", hotelRouter);

// 🔗 connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Atlas connected!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
connectDB();

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
