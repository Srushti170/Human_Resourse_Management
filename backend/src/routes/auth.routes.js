import express from "express";
import {
  signup,
  signin,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);

export default router;
