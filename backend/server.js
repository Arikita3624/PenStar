import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// ✅ Thêm dòng này NGAY SAU khi tạo app
app.use(cors({
  origin: "http://localhost:5173", // URL của React app (Vite default)
}));

app.use(bodyParser.json());

// --- ví dụ routes ---
app.get("/", (req, res) => {
  res.send("Server OK ✅");
});

import roomsRoutes from "./routes/rooms.js";
app.use("/rooms", roomsRoutes);
import branchesRoutes from "./routes/branches.js";
app.use("/branches", branchesRoutes);


// --- chạy server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
