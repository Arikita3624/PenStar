import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./db.js";
import roomsRouter from "./routers/rooms.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rooms", roomsRouter);

// 🚨 Global error handler (optional, cực hữu ích)
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
