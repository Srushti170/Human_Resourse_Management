import Attendance from "../models/attendance.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkIn = asyncHandler(async (req, res) => {
  const record = await Attendance.create({
    employee: req.user._id,
    checkInTime: new Date(),
    status: "Present",
  });

  res.json(record);
});

export const checkOut = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: new Date().setHours(0, 0, 0, 0),
  });

  record.checkOutTime = new Date();
  await record.save();

  res.json(record);
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const list = await Attendance.find({ employee: req.user._id }).sort({
    date: -1,
  });
  res.json(list);
});

export const getAllAttendance = asyncHandler(async (req, res) => {
  const list = await Attendance.find().populate("employee", "firstName lastName");
  res.json(list);
});

export const getAttendanceByEmployee = asyncHandler(async (req, res) => {
  const list = await Attendance.find({ employee: req.params.id });
  res.json(list);
});

export const updateAttendanceStatus = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  res.json(record);
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const report = await Attendance.getAttendanceStats(
    req.user._id,
    month,
    year
  );

  res.json(report);
});
