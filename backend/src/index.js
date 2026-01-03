import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

await connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import leaveBalanceRoutes from "./routes/leaveBalance.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import documentRoutes from "./routes/document.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import activityLogRoutes from "./routes/activityLog.routes.js";

app.get("/", (req, res) => {
  res.send("HRMS Backend server is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-balance", leaveBalanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
