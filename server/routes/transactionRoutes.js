const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDuplicates,
  reviewDuplicate,
  importTransactions
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema
} = require('../validators/transactionValidator');

router.use(protect);

router.get('/', validate(getTransactionsQuerySchema), getTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/duplicates', getDuplicates);
router.post('/import', importTransactions);
router.patch('/:id/duplicate-status', reviewDuplicate);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
