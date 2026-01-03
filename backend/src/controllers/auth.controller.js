import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const generateToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const signup = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  const verifyToken = generateToken(user._id);

  await sendEmail(
    user.email,
    "Verify your email",
    `Verification token: ${verifyToken}`
  );

  res.status(201).json({
    message: "Registered successfully, please verify email",
    user,
  });
});

export const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await user.isValidPassword(password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  const token = user.generatejwt();
  res.json({ token, user });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  await User.findByIdAndUpdate(decoded.id, { isVerified: true });

  res.json({ message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = generateToken(user._id);

  await sendEmail(email, "Password reset", `Reset token: ${resetToken}`);

  res.json({ message: "Password reset email sent" });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("+password");
  user.password = newPassword;
  await user.save();

  res.json({ message: "Password reset successful" });
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});
