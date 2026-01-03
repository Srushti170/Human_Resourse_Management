import express from "express";
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/user.controller.js";

import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// self service
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put("/me/profile-picture", protect, uploadProfilePicture);

// admin zone
router.get("/", protect, isAdmin, getAllEmployees);
router.get("/:id", protect, isAdmin, getEmployeeById);
router.put("/:id", protect, isAdmin, updateEmployee);
router.delete("/:id", protect, isAdmin, deleteEmployee);

export default router;
