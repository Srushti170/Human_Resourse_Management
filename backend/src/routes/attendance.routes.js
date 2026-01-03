import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getAttendanceByEmployee,
  updateAttendanceStatus,
  getAttendanceReport,
} from "../controllers/attendance.controller.js";

import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// employee
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.get("/me", protect, getMyAttendance);

// admin
router.get("/", protect, isAdmin, getAllAttendance);
router.get("/employee/:id", protect, isAdmin, getAttendanceByEmployee);
router.put("/:id/status", protect, isAdmin, updateAttendanceStatus);
router.get("/report", protect, isAdmin, getAttendanceReport);

export default router;
