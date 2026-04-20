const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options prevent deprecation warnings
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(` MongoDB Connection Failed: ${error.message}`);
    process.exit(1); // Exit process on DB failure
  }
};

module.exports = connectDB;
