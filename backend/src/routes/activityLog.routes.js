import express from "express";
import {
  getRecentActivity,
  getUserLogs,
} from "../controllers/activityLog.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/recent", protect, isAdmin, getRecentActivity);
router.get("/user/:id", protect, isAdmin, getUserLogs);

export default router;
