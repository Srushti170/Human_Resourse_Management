import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import Payroll from "../models/payroll.model.js";

export const getEmployeeDashboard = async (req, res) => {
  const attToday = await Attendance.findOne({
    employee: req.user._id,
  });

  const leaves = await Leave.find({ employee: req.user._id }).countDocuments();

  res.json({
    attendanceToday: attToday,
    leaveCount: leaves,
  });
};

export const getAdminDashboard = async (req, res) => {
  const totalAttendance = await Attendance.countDocuments();
  const totalLeaves = await Leave.countDocuments();
  const totalPayrolls = await Payroll.countDocuments();

  res.json({
    totalAttendance,
    totalLeaves,
    totalPayrolls,
  });
};
