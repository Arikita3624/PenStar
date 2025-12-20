import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./db.js";
import roomsRouter from "./routers/rooms.js";
import roomDevicesRouter from "./routers/roomdevices.js";
import roomTypeRouter from "./routers/roomstype.js";
import roomTypeEquipmentsRouter from "./routers/roomtype_equipments.js";
import FloorsRouter from "./routers/floors.js";
import serviceRouter from "./routers/services.js";
// Đã xóa serviceTypesRouter
import usersRouter from "./routers/users.js";
import rolesRouter from "./routers/roles.js";
import roomImagesRouter from "./routers/roomimages.js";
import roomTypeImagesRouter from "./routers/roomtypeimages.js";
import bookingsRouter from "./routers/bookings.js";
import bookingItemsRouter from "./routers/booking_items.js";
import bookingServicesRouter from "./routers/booking_services.js";
import stayStatusRouter from "./routers/stay_status.js";
import paymentRouter from "./routers/payment.js";
import statisticsRouter from "./routers/statistics.js";
import masterEquipmentsRouter from "./routers/master_equipments.js";
import bookingIncidentsRouter from "./routers/booking_incidents.js";
import equipmentStockLogsRouter from "./routers/equipment_stock_logs.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/rooms", roomsRouter);
app.use("/api/room-devices", roomDevicesRouter);
app.use("/api/roomtypes", roomTypeRouter);
app.use("/api/roomtype-equipments", roomTypeEquipmentsRouter);
app.use("/api/floors", FloorsRouter);
app.use("/api/services", serviceRouter);
// Đã xóa route /api/service-types
app.use("/api/room-images", roomImagesRouter);
app.use("/api/roomtype-images", roomTypeImagesRouter);
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/booking-items", bookingItemsRouter);
app.use("/api/booking-services", bookingServicesRouter);
app.use("/api/stay-status", stayStatusRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/master-equipments", masterEquipmentsRouter);
app.use("/api/booking-incidents", bookingIncidentsRouter);

// Route nhập/xuất/điều chuyển kho thiết bị
app.use("/api/equipment-stock-logs", equipmentStockLogsRouter);

import path from "path";
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
