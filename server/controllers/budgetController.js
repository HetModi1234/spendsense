const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { getBudgetRecommendations } = require('../services/budgetRecommendationService');
const { getCurrentMonthStr, getMonthDateRange } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');

// @desc    Get user budget for a specific month (or list of budgets)
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const { month = getCurrentMonthStr() } = req.query;

    const budget = await Budget.findOne({
      userId: req.user._id,
      month
    }).lean();

    // Calculate actual expenses for the month
    const range = getMonthDateRange(month);
    const expenses = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      date: { $gte: range.startDate, $lte: range.endDate }
    }).lean();

    let totalSpent = 0;
    const catSpentMap = {};

    expenses.forEach(e => {
      totalSpent += e.amount;
      catSpentMap[e.category] = (catSpentMap[e.category] || 0) + e.amount;
    });

    totalSpent = roundNumber(totalSpent);

    const totalBudget = budget ? budget.totalBudget : req.user.monthlyBudget || 0;
    const remaining = roundNumber(Math.max(0, totalBudget - totalSpent));
    const utilization = totalBudget > 0 ? roundNumber((totalSpent / totalBudget) * 100, 1) : 0;

    const categoryBudgets = (budget?.categoryBudgets || []).map(cb => {
      const spent = roundNumber(catSpentMap[cb.category] || 0);
      const catRemaining = roundNumber(Math.max(0, cb.limit - spent));
      const catUtilization = cb.limit > 0 ? roundNumber((spent / cb.limit) * 100, 1) : 0;
      return {
        category: cb.category,
        limit: cb.limit,
        spent,
        remaining: catRemaining,
        utilization: catUtilization
      };
    });

    res.json({
      success: true,
      data: {
        budget: budget || null,
        month,
        totalBudget,
        totalSpent,
        remaining,
        utilization,
        categoryBudgets,
        status: utilization >= 100 ? 'exceeded' : utilization >= 90 ? 'critical' : utilization >= 75 ? 'warning' : 'healthy'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update monthly budget
// @route   POST /api/budgets
// @access  Private
const setBudget = async (req, res, next) => {
  try {
    const { month, totalBudget, categoryBudgets = [] } = req.body;

    let budget = await Budget.findOne({ userId: req.user._id, month });

    if (budget) {
      budget.totalBudget = roundNumber(totalBudget);
      budget.categoryBudgets = categoryBudgets.map(cb => ({
        category: cb.category,
        limit: roundNumber(cb.limit)
      }));
      await budget.save();
    } else {
      budget = await Budget.create({
        userId: req.user._id,
        month,
        totalBudget: roundNumber(totalBudget),
        categoryBudgets: categoryBudgets.map(cb => ({
          category: cb.category,
          limit: roundNumber(cb.limit)
        }))
      });
    }

    res.json({
      success: true,
      message: 'Budget saved successfully.',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI-powered budget recommendations based on historical spending
// @route   GET /api/budgets/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getBudgetRecommendations(
      req.user._id,
      req.user.currency || 'INR'
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  setBudget,
  deleteBudget,
  getRecommendations
};
