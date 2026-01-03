import express from "express";
import {
  getLeaveBalance,
} from "../controllers/leave.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getLeaveBalance);

export default router;
