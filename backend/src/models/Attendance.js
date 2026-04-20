const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: "" }, 
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, 
      required: true,
    },

   
    punchIn: {
      time: { type: Date, default: null },
      selfie: { type: String, default: "" }, // base64 string
      location: { type: locationSchema, default: null },
    },

  
    punchOut: {
      time: { type: Date, default: null },
      selfie: { type: String, default: "" },
      location: { type: locationSchema, default: null },
    },


    totalWorkingMinutes: {
      type: Number,
      default: 0, 
    },

    status: {
      type: String,
      enum: ["present", "absent", "incomplete", "completed"],
      default: "absent",
    },

   
    overtimeRequested: { type: Boolean, default: false },
    overtimeStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    overtimeMinutes: { type: Number, default: 0 },

    remarks: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);


attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });


attendanceSchema.virtual("workingHours").get(function () {
  const hrs = Math.floor(this.totalWorkingMinutes / 60);
  const mins = this.totalWorkingMinutes % 60;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
});

attendanceSchema.set("toJSON", { virtuals: true });
attendanceSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
