const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dateStr: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"],
      required: true,
    },
    checkIn: {
      type: String,
      default: "",
    },
    checkOut: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to ensure a staff member can only have one attendance log per calendar date
attendanceSchema.index({ staff: 1, dateStr: 1 }, { unique: true });
// Index on dateStr for querying date-specific reports
attendanceSchema.index({ dateStr: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
