export const generateAttendanceReport = (req, res) => {
  res.json({ message: "Attendance report generated" });
};

export const generateLeaveReport = (req, res) => {
  res.json({ message: "Leave report generated" });
};

export const generatePayrollReport = (req, res) => {
  res.json({ message: "Payroll report generated" });
};

export const exportReport = (req, res) => {
  res.json({ message: "Report exported" });
};
