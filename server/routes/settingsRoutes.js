const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  exportUserData,
  deleteFinancialData,
  deleteAccount
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.get('/export-data', exportUserData);
router.delete('/financial-data', deleteFinancialData);
router.delete('/account', deleteAccount);

module.exports = router;
