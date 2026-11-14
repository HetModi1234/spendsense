const { parseExpenseWithAI } = require('../services/expenseParserService');
const { processUserChatMessage } = require('../services/financialChatService');
const { generateSpendingInsights } = require('../services/financialInsightsService');
const { computeForecast } = require('../services/forecastService');
const { getBudgetRecommendations } = require('../services/budgetRecommendationService');
const AIConversation = require('../models/AIConversation');

// @desc    Parse natural-language expense
// @route   POST /api/ai/parse-expense
// @access  Private
const parseExpense = async (req, res, next) => {
  try {
    const { text } = req.body;
    const currency = req.user.currency || 'INR';

    const result = await parseExpenseWithAI(text, currency);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Chat with SpendSense AI Assistant
// @route   POST /api/ai/chat
// @access  Private
const chat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const currency = req.user.currency || 'INR';

    const result = await processUserChatMessage(
      req.user._id,
      message,
      conversationId,
      currency
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user AI conversations
// @route   GET /api/ai/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation history
// @route   GET /api/ai/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete conversation
// @route   DELETE /api/ai/conversations/:id
// @access  Private
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await AIConversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Spending Insights
// @route   POST /api/ai/insights
// @access  Private
const getInsights = async (req, res, next) => {
  try {
    const { month } = req.body || {};
    const currency = req.user.currency || 'INR';

    const insights = await generateSpendingInsights(req.user._id, month, currency);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending forecast
// @route   POST /api/ai/forecast
// @access  Private
const getForecast = async (req, res, next) => {
  try {
    const { month } = req.body || {};
    const currency = req.user.currency || 'INR';

    const forecast = await computeForecast(req.user._id, month, currency);

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI budget recommendations
// @route   POST /api/ai/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
  try {
    const currency = req.user.currency || 'INR';
    const recommendations = await getBudgetRecommendations(req.user._id, currency);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  parseExpense,
  chat,
  getConversations,
  getConversationById,
  deleteConversation,
  getInsights,
  getForecast,
  getRecommendations
};
