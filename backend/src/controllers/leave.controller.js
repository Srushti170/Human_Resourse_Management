import Leave from "../models/leave.model.js";
import LeaveBalance from "../models/leaveBalance.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const applyLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.create({
    ...req.body,
    employee: req.user._id,
  });

  res.json(leave);
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(leaves);
});

export const getAllLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find().populate("employee", "firstName lastName");
  res.json(leaves);
});

export const getLeaveById = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  res.json(leave);
});

export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);

  await leave.approve(req.user._id);

  const balance = await LeaveBalance.getBalanceForEmployee(leave.employee);
  await balance.deductLeave(leave.leaveType, leave.numberOfDays);

  res.json(leave);
});

export const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  await leave.reject(req.user._id);
  res.json(leave);
});

export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(leave);
});

export const deleteLeave = asyncHandler(async (req, res) => {
  await Leave.findByIdAndDelete(req.params.id);
  res.json({ message: "Leave request cancelled" });
});

export const getLeaveBalance = asyncHandler(async (req, res) => {
  const bal = await LeaveBalance.getBalanceForEmployee(req.user._id);
  res.json(bal);
});
