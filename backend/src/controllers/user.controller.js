import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
  });
  res.json(updated);
});

export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { "profile.photo": req.body.photoUrl },
    { new: true }
  );
  res.json(updated);
});

export const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find();
  res.json(employees);
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.id);
  res.json(employee);
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(employee);
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Employee deleted" });
});
