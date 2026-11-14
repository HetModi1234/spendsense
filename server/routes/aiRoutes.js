const express = require('express');
const router = express.Router();
const {
  parseExpense,
  chat,
  getConversations,
  getConversationById,
  deleteConversation,
  getInsights,
  getForecast,
  getRecommendations
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validationMiddleware');
const {
  parseExpenseInputSchema,
  chatInputSchema,
  forecastInputSchema
} = require('../validators/aiValidator');

router.use(protect);

router.post('/parse-expense', aiLimiter, validate(parseExpenseInputSchema), parseExpense);
router.post('/chat', aiLimiter, validate(chatInputSchema), chat);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);
router.post('/insights', aiLimiter, getInsights);
router.post('/forecast', aiLimiter, validate(forecastInputSchema), getForecast);
router.post('/recommendations', aiLimiter, getRecommendations);

module.exports = router;
