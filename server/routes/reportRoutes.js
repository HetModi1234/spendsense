const express = require('express');
const router = express.Router();
const {
  getWeeklyReport,
  getMonthlyReport,
  getAnnualReport,
  exportCSV,
  exportPDF
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/annual', getAnnualReport);
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);

module.exports = router;
