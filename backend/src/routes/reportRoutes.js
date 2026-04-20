const express = require("express");
const router  = express.Router();

const { downloadPDF, downloadExcel } = require("../controllers/reportController");
const { protect }  = require("../middleware/authMiddleware");


router.use(protect);

router.get("/pdf",   downloadPDF);
router.get("/excel", downloadExcel);

module.exports = router;
