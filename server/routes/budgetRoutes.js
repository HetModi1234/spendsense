const express = require('express');
const router = express.Router();
const {
  getBudgets,
  setBudget,
  deleteBudget,
  getRecommendations
} = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createOrUpdateBudgetSchema } = require('../validators/budgetValidator');

router.use(protect);

router.get('/', getBudgets);
router.post('/', validate(createOrUpdateBudgetSchema), setBudget);
router.get('/recommendations', getRecommendations);
router.delete('/:id', deleteBudget);

module.exports = router;
