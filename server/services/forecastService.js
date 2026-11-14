const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { getCurrentMonthStr, getMonthDateRange, getMonthProgress } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');
const { getGenerativeModel, isGeminiConfigured } = require('./geminiService');

/**
 * Computes deterministic month-end spending forecast based on run-rate and historical data.
 */
const computeForecast = async (userId, targetMonth = null, userCurrency = 'INR') => {
  const month = targetMonth || getCurrentMonthStr();
  const dateRange = getMonthDateRange(month);
  const progress = getMonthProgress(month);

  const [transactions, budget] = await Promise.all([
    Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    }).lean(),
    Budget.findOne({ userId, month }).lean()
  ]);

  if (transactions.length === 0) {
    return {
      hasData: false,
      month,
      message: 'Insufficient spending data for this month to generate a reliable projection.'
    };
  }

  let currentSpending = 0;
  const categoryTotals = {};

  transactions.forEach(t => {
    currentSpending += t.amount;
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  currentSpending = roundNumber(currentSpending);

  // Daily run rate
  const dailyRunRate = roundNumber(currentSpending / progress.elapsedDays);

  // Projected month-end total = (current spending / elapsed days) * total days
  const projectedTotal = roundNumber(dailyRunRate * progress.totalDays);
  const remainingEstimatedSpending = roundNumber(Math.max(0, projectedTotal - currentSpending));

  // Category projections
  const categoryProjections = Object.entries(categoryTotals).map(([cat, spent]) => {
    const catDaily = spent / progress.elapsedDays;
    const catProjected = roundNumber(catDaily * progress.totalDays);
    const catBudgetObj = budget ? budget.categoryBudgets.find(b => b.category === cat) : null;
    const catLimit = catBudgetObj ? catBudgetObj.limit : null;
    const willExceed = catLimit ? catProjected > catLimit : false;

    return {
      category: cat,
      currentSpent: roundNumber(spent),
      projectedTotal: catProjected,
      limit: catLimit,
      willExceed,
      overrunAmount: willExceed ? roundNumber(catProjected - catLimit) : 0
    };
  }).sort((a, b) => b.projectedTotal - a.projectedTotal);

  // Overall budget comparison
  const totalBudget = budget ? budget.totalBudget : 0;
  const willOverrunBudget = totalBudget > 0 && projectedTotal > totalBudget;
  const projectedOverrunAmount = willOverrunBudget ? roundNumber(projectedTotal - totalBudget) : 0;

  const result = {
    hasData: true,
    month,
    progress: {
      elapsedDays: progress.elapsedDays,
      totalDays: progress.totalDays,
      remainingDays: progress.remainingDays,
      percentMonthPassed: roundNumber((progress.elapsedDays / progress.totalDays) * 100, 1)
    },
    metrics: {
      currentSpending,
      dailyRunRate,
      projectedTotal,
      remainingEstimatedSpending,
      totalBudget,
      willOverrunBudget,
      projectedOverrunAmount
    },
    categoryProjections,
    disclaimer: 'Projections are mathematical estimates based on current daily spending velocity, not guaranteed future outcomes.'
  };

  // AI narrative explanation
  if (!isGeminiConfigured()) {
    result.aiExplanation = willOverrunBudget
      ? `At your current velocity of ${userCurrency} ${dailyRunRate}/day, your projected spending is ${userCurrency} ${projectedTotal}, which would exceed your budget of ${userCurrency} ${totalBudget} by ${userCurrency} ${projectedOverrunAmount}. Consider reducing discretionary spending in ${categoryProjections[0]?.category || 'top categories'} for the remaining ${progress.remainingDays} days.`
      : `At your current spending velocity of ${userCurrency} ${dailyRunRate}/day, your projected month-end total is ${userCurrency} ${projectedTotal}. You are on track to stay within your budget.`;
    return result;
  }

  try {
    const model = getGenerativeModel();
    const prompt = `
Explain this spending projection in 2-3 friendly, practical sentences.
Include 2 specific scenario options to keep spending under control during the remaining ${progress.remainingDays} days.
DO NOT invent any numbers; use the exact verified figures below:

Verified Data:
- Month: ${month} (${progress.elapsedDays} of ${progress.totalDays} days passed)
- Current Spending: ${userCurrency} ${currentSpending}
- Daily Run Rate: ${userCurrency} ${dailyRunRate}/day
- Estimated Month-End: ${userCurrency} ${projectedTotal}
- Total Budget: ${userCurrency} ${totalBudget}
- Budget Overrun: ${willOverrunBudget ? `Exceeds by ${userCurrency} ${projectedOverrunAmount}` : 'Within budget'}
- Top Category Projections: ${JSON.stringify(categoryProjections.slice(0, 3))}
`;

    const aiRes = await model.generateContent(prompt);
    result.aiExplanation = aiRes.response.text().trim();
  } catch (err) {
    console.error('[Gemini Forecast Error]:', err.message);
    result.aiExplanation = `Projected month-end expenses are ${userCurrency} ${projectedTotal} based on daily average of ${userCurrency} ${dailyRunRate}.`;
  }

  return result;
};

module.exports = {
  computeForecast
};
