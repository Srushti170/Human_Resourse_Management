import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true,
      default: () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      }
    },

    checkInTime: Date,
    checkOutTime: Date,

    status: {
      type: String,
      enum: ["Present", "Absent", "Half-day", "Leave"],
      default: "Absent",
      required: true,
      index: true
    },

    workingHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 24
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500
    },

    checkInLocation: {
      latitude: Number,
      longitude: Number
    },

    checkOutLocation: {
      latitude: Number,
      longitude: Number
    },

    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

//
// 🔹 UNIQUE — 1 attendance per employee per day
//
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: -1 });


//
// 🔹 VALIDATIONS
//

// Check-in must be on same date
attendanceSchema.path("checkInTime").validate(function (v) {
  if (!v) return true;

  const base = new Date(this.date);
  base.setHours(0, 0, 0, 0);

  const test = new Date(v);
  test.setHours(0, 0, 0, 0);

  return test.getTime() === base.getTime();
}, "Check-in must be on same date");

// Check-out must be after check-in
attendanceSchema.path("checkOutTime").validate(function (v) {
  if (!v || !this.checkInTime) return true;
  return v > this.checkInTime;
}, "Check-out must be after check-in");


//
// 🔹 PRE-SAVE (NO next — Mongoose 7 safe)
//
attendanceSchema.pre("save", function () {

  // Only when both exist
  if (this.checkInTime && this.checkOutTime) {

    const diffMs = this.checkOutTime - this.checkInTime;

    // convert ms → hours (2 decimals)
    this.workingHours = Math.max(
      0,
      Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
    );

    // infer status automatically IF not manually changed
    if (this.isNew || this.status === "Absent") {
      if (this.workingHours >= 8) this.status = "Present";
      else if (this.workingHours >= 4) this.status = "Half-day";
      else this.status = "Absent";
    }
  }
});


//
// 🔹 STATIC METHODS
//

attendanceSchema.statics.getAttendanceStats = async function (
  employeeId,
  month,
  year
) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        date: { $gte: start, $lte: end },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalHours: { $sum: "$workingHours" }
      }
    }
  ]);
};

attendanceSchema.statics.getAttendanceForRange = async function (
  employeeId,
  start,
  end
) {
  return this.find({
    employee: new mongoose.Types.ObjectId(employeeId),
    date: { $gte: start, $lte: end },
    isDeleted: false
  }).sort({ date: -1 });
};


//
// 🔹 INSTANCE METHODS
//

attendanceSchema.methods.isCheckedIn = function () {
  return Boolean(this.checkInTime && !this.checkOutTime);
};

attendanceSchema.methods.checkIn = async function (time = new Date()) {
  this.checkInTime = time;
  this.status = "Present";
  return this.save();
};

attendanceSchema.methods.checkOut = async function (time = new Date()) {
  this.checkOutTime = time;
  return this.save();
};

export default mongoose.model("Attendance", attendanceSchema);
