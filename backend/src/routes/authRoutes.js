const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
  createUser,
  getAllUsers,
  toggleUserStatus,
  updateUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");


router.post("/signup", signup);
router.post("/login", login);


router.get("/me", protect, getMe);


router.post("/create-user",                    protect, authorize("admin"), createUser);
router.get("/users",                           protect, authorize("admin"), getAllUsers);
router.patch("/users/:id/toggle-status",       protect, authorize("admin"), toggleUserStatus);
router.patch("/users/:id",                     protect, authorize("admin"), updateUser);

module.exports = router;
