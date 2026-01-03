import Payroll from "../models/payroll.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyPayroll = asyncHandler(async (req, res) => {
  const data = await Payroll.find({ employee: req.user._id });
  res.json(data);
});

export const getAllPayrolls = asyncHandler(async (req, res) => {
  const data = await Payroll.find().populate("employee", "firstName lastName");
  res.json(data);
});

export const getPayrollByEmployee = asyncHandler(async (req, res) => {
  const data = await Payroll.find({ employee: req.params.id });
  res.json(data);
});

export const updatePayroll = asyncHandler(async (req, res) => {
  const data = await Payroll.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(data);
});

export const createPayroll = asyncHandler(async (req, res) => {
  const pay = await Payroll.create(req.body);
  res.json(pay);
});

export const getPayrollHistory = asyncHandler(async (req, res) => {
  const data = await Payroll.find({ employee: req.user._id });
  res.json(data);
});
