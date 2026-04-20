const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};


const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user, 
  });
};


const signup = async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;

  
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

   
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }


    const safeRole = role === "admin" ? "employee" : role || "employee";

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      department: department || "",
      managerId: managerId || null,
    });

    logger.info(`New user registered: ${email} (${safeRole})`);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Signup error: ${error.message}`);

  
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }

    res.status(500).json({ success: false, message: "Server error during signup" });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Fetch user with password (select: false on schema, so explicit +password)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    logger.info(`User logged in: ${email} (${user.role})`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};


const getMe = async (req, res) => {
  try {
    // req.user is set by authMiddleware (already fetched from DB)
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    logger.error(`GetMe error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, managerId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role, department, managerId });

    logger.info(`Admin created user: ${email} (${role}) by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    logger.error(`CreateUser error: ${error.message}`);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("managerId", "name email");
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    logger.error(`GetAllUsers error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User ${user.email} status toggled to ${user.isActive} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    logger.error(`ToggleStatus error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const updateUser = async (req, res) => {
  try {
    const allowedFields = ["managerId", "department", "role", "name"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
   
        updates[field] = field === "managerId" && req.body[field] === ""
          ? null
          : req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("managerId", "name email");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    logger.info(`User ${user.email} updated by ${req.user.email}: ${JSON.stringify(updates)}`);

    res.status(200).json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    logger.error(`UpdateUser error: ${error.message}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  createUser,
  getAllUsers,
  toggleUserStatus,
  updateUser,
};
