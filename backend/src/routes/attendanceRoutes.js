const express = require("express");
const router  = express.Router();

const {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getTeamAttendance,
  getAllAttendance,
  getReport,
} = require("../controllers/attendanceController");

const { protect }    = require("../middleware/authMiddleware");
const { authorize }  = require("../middleware/roleMiddleware");


router.use(protect);


router.post("/punch-in",  punchIn);
router.post("/punch-out", punchOut);
router.get("/today",      getTodayAttendance);
router.get("/my",         getMyAttendance);


router.get("/team",   authorize("manager", "admin"), getTeamAttendance);
router.get("/report", authorize("manager", "admin", "employee"), getReport);


router.get("/all", authorize("admin"), getAllAttendance);

module.exports = router;
