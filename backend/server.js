require("dotenv").config(); 
const app = require("./src/app");
const connectDB = require("./src/config/db");
const logger = require("./src/config/logger");


const PORT = process.env.PORT || 5000;


connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(` Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
});
