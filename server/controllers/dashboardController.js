const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { computeFinancialMetrics } = require('../services/financialInsightsService');
const { computeForecast } = require('../services/forecastService');
const { getCurrentMonthStr, getMonthDateRange, getPreviousMonthStr } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');

// @desc    Get dashboard financial summary cards & alerts
// @route   GET /api/dashboard/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const { month = getCurrentMonthStr() } = req.query;
    const currency = req.user.currency || 'INR';

    // Compute metrics for selected month
    const metrics = await computeFinancialMetrics(req.user._id, month);

    // Compute all-time total balance (all income - all expenses)
    const allTransactions = await Transaction.find({ userId: req.user._id }).lean();
    let totalBalance = 0;
    allTransactions.forEach(t => {
      if (t.type === 'income') totalBalance += t.amount;
      else totalBalance -= t.amount;
    });

    // Compute forecast for this month
    const forecast = await computeForecast(req.user._id, month, currency);

    res.json({
      success: true,
      data: {
        totalBalance: roundNumber(totalBalance),
        monthlyIncome: metrics.currentIncome,
        monthlyExpenses: metrics.currentExpense,
        monthlySavings: metrics.currentSavings,
        savingsRate: metrics.savingsRate,
        expenseChangePercent: metrics.expenseChangePercent,
        expenseChangeAmount: metrics.expenseChangeAmount,
        totalBudget: metrics.totalBudget,
        budgetUtilization: metrics.budgetUtilization,
        topCategory: metrics.topCategory,
        forecast: forecast.hasData ? forecast.metrics : null,
        month,
        currency
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get data for charts (Income vs Expense bar, 6-month trends, category pie)
// @route   GET /api/dashboard/charts
// @access  Private
const getCharts = async (req, res, next) => {
  try {
    const { month = getCurrentMonthStr() } = req.query;

    // 1. Category pie chart for current month
    const { startDate, endDate } = getMonthDateRange(month);
    const monthExpenses = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    const catTotals = {};
    monthExpenses.forEach(t => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });

    const categoryChartData = Object.entries(catTotals).map(([name, value]) => ({
      name,
      value: roundNumber(value)
    })).sort((a, b) => b.value - a.value);

    // 2. 6-Month Trend Data (Income vs Expense)
    const pastMonths = [];
    let cur = month;
    for (let i = 0; i < 6; i++) {
      pastMonths.unshift(cur);
      cur = getPreviousMonthStr(cur);
    }

    const trendRangeStart = getMonthDateRange(pastMonths[0]).startDate;
    const trendRangeEnd = getMonthDateRange(pastMonths[pastMonths.length - 1]).endDate;

    const trendTransactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: trendRangeStart, $lte: trendRangeEnd }
    }).lean();

    const monthlyAggregation = {};
    pastMonths.forEach(m => {
      monthlyAggregation[m] = { month: m, income: 0, expense: 0, savings: 0 };
    });

    trendTransactions.forEach(t => {
      const mStr = new Date(t.date).toISOString().slice(0, 7);
      if (monthlyAggregation[mStr]) {
        if (t.type === 'income') {
          monthlyAggregation[mStr].income += t.amount;
        } else {
          monthlyAggregation[mStr].expense += t.amount;
        }
      }
    });

    const monthlyTrendData = pastMonths.map(m => {
      const item = monthlyAggregation[m];
      const income = roundNumber(item.income);
      const expense = roundNumber(item.expense);
      return {
        month: m,
        income,
        expense,
        savings: roundNumber(income - expense)
      };
    });

    // 3. Daily Expense velocity trend for current month
    const dailyMap = {};
    monthExpenses.forEach(t => {
      const dayStr = new Date(t.date).toISOString().split('T')[0];
      dailyMap[dayStr] = (dailyMap[dayStr] || 0) + t.amount;
    });

    const dailyTrendData = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount: roundNumber(amount) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        categoryChartData,
        monthlyTrendData,
        dailyTrendData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent 5-10 transactions for dashboard
// @route   GET /api/dashboard/recent-transactions
// @access  Private
const getRecentTransactions = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || 8, 10);
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getCharts,
  getRecentTransactions
};
