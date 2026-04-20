const Attendance = require("../models/Attendance");
const User       = require("../models/User");
const logger     = require("../config/logger");


const todayStr = () => new Date().toISOString().slice(0, 10);


const calcMins = (start, end) =>
  Math.round((new Date(end) - new Date(start)) / 60000);



const punchIn = async (req, res) => {
  try {
    const { selfie, location } = req.body;
    const userId = req.user._id;
    const date   = todayStr();

   
    if (!selfie) {
      return res.status(400).json({ success: false, message: "Selfie is required for punch-in" });
    }
  
    if (!location?.latitude || !location?.longitude) {
      return res.status(400).json({ success: false, message: "Location is required for punch-in" });
    }


    let record = await Attendance.findOne({ userId, date });
    if (record && record.punchIn?.time) {
      return res.status(409).json({ success: false, message: "Already punched in today" });
    }


    if (!record) {
      record = await Attendance.create({
        userId,
        date,
        punchIn: { time: new Date(), selfie, location },
        status: "present",
      });
    } else {
      record.punchIn = { time: new Date(), selfie, location };
      record.status  = "present";
      await record.save();
    }

    logger.info(`Punch-in: ${req.user.email} at ${date}`);

    res.status(200).json({
      success: true,
      message: "Punched in successfully",
      attendance: record,
    });
  } catch (error) {
    logger.error(`PunchIn error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error during punch-in" });
  }
};

const punchOut = async (req, res) => {
  try {
    const { selfie, location } = req.body;
    const userId = req.user._id;
    const date   = todayStr();

    if (!selfie) {
      return res.status(400).json({ success: false, message: "Selfie is required for punch-out" });
    }
    if (!location?.latitude || !location?.longitude) {
      return res.status(400).json({ success: false, message: "Location is required for punch-out" });
    }

    const record = await Attendance.findOne({ userId, date });

    if (!record || !record.punchIn?.time) {
      return res.status(400).json({ success: false, message: "You haven't punched in today" });
    }
    if (record.punchOut?.time) {
      return res.status(409).json({ success: false, message: "Already punched out today" });
    }

    const now             = new Date();
    const totalMins       = calcMins(record.punchIn.time, now);
    const STANDARD_MINS   = 480; // 8 hours

    record.punchOut            = { time: now, selfie, location };
    record.totalWorkingMinutes = totalMins;
    record.status              = totalMins >= STANDARD_MINS ? "completed" : "incomplete";

    // If worked overtime (> 8hrs), calculate overtime minutes
    if (totalMins > STANDARD_MINS) {
      record.overtimeMinutes = totalMins - STANDARD_MINS;
    }

    await record.save();

    logger.info(`Punch-out: ${req.user.email} | ${totalMins} mins | ${record.status}`);

    res.status(200).json({
      success: true,
      message: "Punched out successfully",
      attendance: record,
    });
  } catch (error) {
    logger.error(`PunchOut error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error during punch-out" });
  }
};


const getTodayAttendance = async (req, res) => {
  try {
    const record = await Attendance.findOne({
      userId: req.user._id,
      date: todayStr(),
    });

    res.status(200).json({
      success: true,
      attendance: record || null,
    });
  } catch (error) {
    logger.error(`GetToday error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getMyAttendance = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    const [records, total, totalPresent] = await Promise.all([
      Attendance.find({ userId: req.user._id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments({ userId: req.user._id }),
      Attendance.countDocuments({
        userId: req.user._id,
        status: { $in: ["present", "completed", "incomplete"] },
      }),
    ]);

    res.status(200).json({
      success: true,
      records,
      total,
      totalPresent,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`GetMyAttendance error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getTeamAttendance = async (req, res) => {
  try {
    const date  = req.query.date || todayStr();
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    // Find all employees under this manager
    const teamMembers = await User.find({ managerId: req.user._id }).select("_id");
    const teamIds     = teamMembers.map((u) => u._id);

    const [records, total] = await Promise.all([
      Attendance.find({ userId: { $in: teamIds }, date })
        .populate("userId", "name email department role")
        .sort({ "userId.name": 1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments({ userId: { $in: teamIds }, date }),
    ]);

    res.status(200).json({
      success: true,
      records,
      total,
      date,
      teamSize: teamIds.length,
    });
  } catch (error) {
    logger.error(`GetTeamAttendance error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getAllAttendance = async (req, res) => {
  try {
    const date   = req.query.date || todayStr();
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip   = (page - 1) * limit;

    const filter = { date };
    if (req.query.userId) filter.userId = req.query.userId;

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate("userId", "name email department role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      records,
      total,
      date,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`GetAllAttendance error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }

    let filter = {
      date: { $gte: startDate, $lte: endDate },
    };

    // Role-based filter
    if (req.user.role === "employee") {
      filter.userId = req.user._id; 
    } else if (req.user.role === "manager") {
      const teamMembers = await User.find({ managerId: req.user._id }).select("_id");
      const teamIds     = teamMembers.map((u) => u._id);
      filter.userId     = userId ? userId : { $in: teamIds };
    } else {
     
      if (userId) filter.userId = userId;
    }

    const records = await Attendance.find(filter)
      .populate("userId", "name email department role")
      .sort({ date: -1, "userId.name": 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    logger.error(`GetReport error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  getReport,  
};
