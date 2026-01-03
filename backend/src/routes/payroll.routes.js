import express from "express";
import {
  getMyPayroll,
  getAllPayrolls,
  getPayrollByEmployee,
  updatePayroll,
  createPayroll,
  getPayrollHistory,
} from "../controllers/payroll.controller.js";

import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// employee
router.get("/me", protect, getMyPayroll);
router.get("/history", protect, getPayrollHistory);

// admin
router.get("/", protect, isAdmin, getAllPayrolls);
router.get("/employee/:id", protect, isAdmin, getPayrollByEmployee);
router.post("/", protect, isAdmin, createPayroll);
router.put("/:id", protect, isAdmin, updatePayroll);

export default router;
