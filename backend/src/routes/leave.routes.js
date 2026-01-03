import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  updateLeave,
  deleteLeave,
  getLeaveBalance,
} from "../controllers/leave.controller.js";

import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// self service
router.post("/", protect, applyLeave);
router.get("/me", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);

// admin
router.get("/", protect, isAdmin, getAllLeaves);
router.get("/:id", protect, getLeaveById);
router.put("/:id", protect, updateLeave);
router.delete("/:id", protect, deleteLeave);

router.put("/:id/approve", protect, isAdmin, approveLeave);
router.put("/:id/reject", protect, isAdmin, rejectLeave);

export default router;
