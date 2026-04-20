const OvertimeRequest = require("../models/OvertimeRequest");
const Attendance      = require("../models/Attendance");
const User            = require("../models/User");
const logger          = require("../config/logger");
const todayStr = () => new Date().toISOString().slice(0, 10);


const requestOvertime = async (req, res) => {
  try {
    const { requestedMinutes, reason } = req.body;
    const userId = req.user._id;
    const date   = todayStr();

    if (!requestedMinutes || requestedMinutes < 1) {
      return res.status(400).json({ success: false, message: "requestedMinutes must be > 0" });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: "Reason is required" });
    }

  
    const attendance = await Attendance.findOne({ userId, date });
    if (!attendance || !attendance.punchIn?.time) {
      return res.status(400).json({
        success: false,
        message: "You must punch in before requesting overtime",
      });
    }

  
    const existing = await OvertimeRequest.findOne({ employeeId: userId, date });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Overtime already requested for today",
      });
    }

    const otRequest = await OvertimeRequest.create({
      employeeId:       userId,
      attendanceId:     attendance._id,
      date,
      requestedMinutes: parseInt(requestedMinutes),
      reason:           reason.trim(),
    });

    attendance.overtimeRequested = true;
    attendance.overtimeStatus    = "pending";
    await attendance.save();

    logger.info(`OT requested: ${req.user.email} for ${date} (${requestedMinutes} mins)`);

    res.status(201).json({
      success: true,
      message: "Overtime request submitted",
      request: otRequest,
    });
  } catch (error) {
    logger.error(`RequestOvertime error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getMyOvertimeRequests = async (req, res) => {
  try {
    const requests = await OvertimeRequest.find({ employeeId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    logger.error(`GetMyOT error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getPendingRequests = async (req, res) => {
  try {
    let filter = { status: "pending" };

    
    if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user._id }).select("_id");
      const teamIds     = teamMembers.map((u) => u._id);
      filter.employeeId = { $in: teamIds };
    }

    const requests = await OvertimeRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("employeeId", "name email department role");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    logger.error(`GetPendingOT error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const reviewOvertimeRequest = async (req, res) => {
  try {
    const { status, reviewRemarks } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const otRequest = await OvertimeRequest.findById(req.params.id);
    if (!otRequest) {
      return res.status(404).json({ success: false, message: "Overtime request not found" });
    }
    if (otRequest.status !== "pending") {
      return res.status(409).json({ success: false, message: "Request already reviewed" });
    }

    // Update OT request
    otRequest.status        = status;
    otRequest.reviewedBy    = req.user._id;
    otRequest.reviewedAt    = new Date();
    otRequest.reviewRemarks = reviewRemarks || "";
    await otRequest.save();

  
    const attendance = await Attendance.findById(otRequest.attendanceId);
    if (attendance) {
      attendance.overtimeStatus  = status;
      attendance.overtimeMinutes = status === "approved" ? otRequest.requestedMinutes : 0;
      await attendance.save();
    }

    logger.info(`OT ${status}: ${otRequest.employeeId} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `Overtime request ${status}`,
      request: otRequest,
    });
  } catch (error) {
    logger.error(`ReviewOT error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getAllOvertimeRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const requests = await OvertimeRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("employeeId", "name email department role")
      .populate("reviewedBy", "name email");

    res.status(200).json({ success: true, requests });
  } catch (error) {
    logger.error(`GetAllOT error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  requestOvertime,
  getMyOvertimeRequests,
  getPendingRequests,
  reviewOvertimeRequest,
  getAllOvertimeRequests,
};
