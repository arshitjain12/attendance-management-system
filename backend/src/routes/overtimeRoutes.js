const express = require("express");
const router  = express.Router();

const {
  requestOvertime,
  getMyOvertimeRequests,
  getPendingRequests,
  reviewOvertimeRequest,
  getAllOvertimeRequests,
} = require("../controllers/overtimeController");

const { protect }   = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);


router.post("/request", requestOvertime);
router.get("/my",       getMyOvertimeRequests);


router.get("/pending",       authorize("manager", "admin"), getPendingRequests);
router.patch("/:id/review",  authorize("manager", "admin"), reviewOvertimeRequest);


router.get("/all", authorize("admin"), getAllOvertimeRequests);

module.exports = router;
