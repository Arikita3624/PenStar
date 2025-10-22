import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./db.js";
import roomsRouter from "./routers/rooms.js";
import roomTypeRouter from "./routers/roomstype.js";
import FloorsRouter from "./routers/floors.js";
import serviceRouter from "./routers/services.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rooms", roomsRouter);
app.use("/api/roomtypes", roomTypeRouter);
app.use("/api/floors", FloorsRouter);
app.use("/api/services", serviceRouter);
import roomImagesRouter from "./routers/roomimages.js";
app.use("/api/room-images", roomImagesRouter);

import path from "path";
import expressStatic from "express";
// serve uploaded files from /uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  res.status(500).json({
    success: false,
    message: "🚨 Internal server error",
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
