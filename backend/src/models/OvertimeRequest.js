const mongoose = require("mongoose");

const overtimeRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
    },

    date: {
      type: String, 
      required: true,
    },

    requestedMinutes: {
      type: Number,
      required: true,
      min: [1, "Overtime must be at least 1 minute"],
    },

    reason: {
      type: String,
      required: [true, "Reason for overtime is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },


    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewRemarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


overtimeRequestSchema.index({ employeeId: 1, date: 1 });
overtimeRequestSchema.index({ status: 1 });

module.exports = mongoose.model("OvertimeRequest", overtimeRequestSchema);
