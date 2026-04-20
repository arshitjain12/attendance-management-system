const jwt = require("jsonwebtoken");
const User = require("../models/User");
const logger = require("../config/logger");

const protect = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — no token provided",
      });
    }

  
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — user no longer exists",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }


    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth failed: ${error.message}`);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    return res.status(500).json({ success: false, message: "Authentication error" });
  }
};

module.exports = { protect };
