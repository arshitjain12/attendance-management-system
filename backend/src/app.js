const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./config/logger");

const authRoutes       = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const overtimeRoutes   = require("./routes/overtimeRoutes");
const reportRoutes     = require("./routes/reportRoutes");

const app = express();



app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true }));


app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
  })
);


app.use("/api/auth",       authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/overtime",   overtimeRoutes);
app.use("/api/reports",    reportRoutes);


app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});


app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} — ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
