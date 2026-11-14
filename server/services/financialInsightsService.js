const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { getCurrentMonthStr, getMonthDateRange, getPreviousMonthStr } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');
const { getGenerativeModel, isGeminiConfigured } = require('./geminiService');

/**
 * Deterministically computes user financial metrics for a given month and compares with previous month.
 */
const computeFinancialMetrics = async (userId, targetMonth = null) => {
  const currentMonth = targetMonth || getCurrentMonthStr();
  const previousMonth = getPreviousMonthStr(currentMonth);

  const currentRange = getMonthDateRange(currentMonth);
  const previousRange = getMonthDateRange(previousMonth);

  // Fetch transactions for both months
  const [currentTransactions, previousTransactions, budget] = await Promise.all([
    Transaction.find({
      userId,
      date: { $gte: currentRange.startDate, $lte: currentRange.endDate }
    }).lean(),
    Transaction.find({
      userId,
      date: { $gte: previousRange.startDate, $lte: previousRange.endDate }
    }).lean(),
    Budget.findOne({ userId, month: currentMonth }).lean()
  ]);

  // Aggregate current month
  let currentIncome = 0;
  let currentExpense = 0;
  const currentCategoryMap = {};

  currentTransactions.forEach(t => {
    if (t.type === 'income') {
      currentIncome += t.amount;
    } else {
      currentExpense += t.amount;
      currentCategoryMap[t.category] = (currentCategoryMap[t.category] || 0) + t.amount;
    }
  });

  // Aggregate previous month
  let previousIncome = 0;
  let previousExpense = 0;
  const previousCategoryMap = {};

  previousTransactions.forEach(t => {
    if (t.type === 'income') {
      previousIncome += t.amount;
    } else {
      previousExpense += t.amount;
      previousCategoryMap[t.category] = (previousCategoryMap[t.category] || 0) + t.amount;
    }
  });

  currentIncome = roundNumber(currentIncome);
  currentExpense = roundNumber(currentExpense);
  previousIncome = roundNumber(previousIncome);
  previousExpense = roundNumber(previousExpense);

  const currentSavings = roundNumber(currentIncome - currentExpense);
  const savingsRate = currentIncome > 0 ? roundNumber((currentSavings / currentIncome) * 100, 1) : 0;

  const expenseChangeAmount = roundNumber(currentExpense - previousExpense);
  const expenseChangePercent = previousExpense > 0
    ? roundNumber(((currentExpense - previousExpense) / previousExpense) * 100, 1)
    : 0;

  // Category changes and ranking
  const allCategories = Array.from(new Set([
    ...Object.keys(currentCategoryMap),
    ...Object.keys(previousCategoryMap)
  ]));

  const categoryBreakdown = allCategories.map(cat => {
    const current = roundNumber(currentCategoryMap[cat] || 0);
    const previous = roundNumber(previousCategoryMap[cat] || 0);
    const diff = roundNumber(current - previous);
    const percentChange = previous > 0 ? roundNumber(((current - previous) / previous) * 100, 1) : (current > 0 ? 100 : 0);
    const shareOfTotal = currentExpense > 0 ? roundNumber((current / currentExpense) * 100, 1) : 0;

    return {
      category: cat,
      currentSpent: current,
      previousSpent: previous,
      diff,
      percentChange,
      shareOfTotal
    };
  }).sort((a, b) => b.currentSpent - a.currentSpent);

  const topCategory = categoryBreakdown.length > 0 && categoryBreakdown[0].currentSpent > 0
    ? categoryBreakdown[0]
    : null;

  // Significant increases (> 20% and > ₹500 or equivalent)
  const categorySpikes = categoryBreakdown.filter(c => c.diff > 500 && c.percentChange >= 20);

  // Budget comparison
  const totalBudget = budget ? budget.totalBudget : 0;
  const budgetUtilization = totalBudget > 0 ? roundNumber((currentExpense / totalBudget) * 100, 1) : 0;

  return {
    month: currentMonth,
    previousMonth,
    currentIncome,
    currentExpense,
    currentSavings,
    savingsRate,
    previousIncome,
    previousExpense,
    expenseChangeAmount,
    expenseChangePercent,
    topCategory,
    categoryBreakdown,
    categorySpikes,
    totalBudget,
    budgetUtilization,
    transactionCount: currentTransactions.length
  };
};

/**
 * Generates AI-interpreted spending insights based strictly on verified calculations.
 */
const generateSpendingInsights = async (userId, targetMonth = null, userCurrency = 'INR') => {
  const metrics = await computeFinancialMetrics(userId, targetMonth);

  // If Gemini is not configured, generate structured deterministic insights
  if (!isGeminiConfigured()) {
    const deterministicInsights = [];

    if (metrics.transactionCount === 0) {
      deterministicInsights.push({
        title: 'No Data Yet',
        type: 'info',
        summary: `No transactions recorded for ${metrics.month}. Start tracking your expenses to unlock personalized insights.`
      });
    } else {
      // Month-over-month insight
      if (metrics.expenseChangeAmount > 0) {
        deterministicInsights.push({
          title: 'Spending Increased',
          type: 'warning',
          summary: `You spent ${userCurrency} ${Math.abs(metrics.expenseChangeAmount)} (${metrics.expenseChangePercent}%) more compared to last month.`
        });
      } else if (metrics.expenseChangeAmount < 0) {
        deterministicInsights.push({
          title: 'Great Job Saving!',
          type: 'success',
          summary: `Your spending dropped by ${userCurrency} ${Math.abs(metrics.expenseChangeAmount)} (${Math.abs(metrics.expenseChangePercent)}%) compared to last month.`
        });
      }

      // Top category insight
      if (metrics.topCategory) {
        deterministicInsights.push({
          title: `Highest Expense: ${metrics.topCategory.category}`,
          type: 'info',
          summary: `${metrics.topCategory.category} represents ${metrics.topCategory.shareOfTotal}% of your expenses (${userCurrency} ${metrics.topCategory.currentSpent}).`
        });
      }

      // Savings rate
      if (metrics.currentIncome > 0) {
        deterministicInsights.push({
          title: `Savings Rate: ${metrics.savingsRate}%`,
          type: metrics.savingsRate >= 20 ? 'success' : 'warning',
          summary: `You saved ${userCurrency} ${metrics.currentSavings} this month (${metrics.savingsRate}% of income). Target at least 20% for healthy savings.`
        });
      }
    }

    return {
      metrics,
      insights: deterministicInsights,
      aiAnalysis: `Summary for ${metrics.month}: Total Income is ${userCurrency} ${metrics.currentIncome}, Total Expenses ${userCurrency} ${metrics.currentExpense}. Net savings: ${userCurrency} ${metrics.currentSavings}. Top category is ${metrics.topCategory ? metrics.topCategory.category : 'None'}. (Add GEMINI_API_KEY to .env for deeper AI narrative analysis).`
    };
  }

  try {
    const model = getGenerativeModel();

    const prompt = `
Analyze the verified financial metrics below for user month ${metrics.month} and provide 3-4 concise, high-value insights and recommendations.
DO NOT invent or alter any numbers. All financial figures must match the verified data provided.

Verified Financial Metrics:
- Currency: ${userCurrency}
- Current Month: ${metrics.month}
- Total Income: ${metrics.currentIncome}
- Total Expenses: ${metrics.currentExpense}
- Net Savings: ${metrics.currentSavings} (Savings Rate: ${metrics.savingsRate}%)
- Previous Month Expenses: ${metrics.previousExpense}
- Month-over-month Change: ${metrics.expenseChangeAmount} (${metrics.expenseChangePercent}%)
- Total Budget: ${metrics.totalBudget} (Utilization: ${metrics.budgetUtilization}%)
- Top Spending Category: ${metrics.topCategory ? `${metrics.topCategory.category} (${metrics.topCategory.currentSpent}, ${metrics.topCategory.shareOfTotal}% of total)` : 'None'}
- Top Category Spikes: ${JSON.stringify(metrics.categorySpikes)}
- Category Breakdown: ${JSON.stringify(metrics.categoryBreakdown.slice(0, 5))}

Provide your response in JSON format:
{
  "summary": "1-2 sentence executive summary of financial health this month",
  "insights": [
    {
      "title": "Short title",
      "type": "success" | "warning" | "info",
      "summary": "Clear observation based on verified numbers"
    }
  ],
  "savingSuggestions": [
    "Actionable tip 1",
    "Actionable tip 2"
  ]
}
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(result.response.text());

    return {
      metrics,
      insights: parsed.insights || [],
      savingSuggestions: parsed.savingSuggestions || [],
      aiAnalysis: parsed.summary || ''
    };
  } catch (err) {
    console.error('[Gemini Insights Error]:', err.message);
    return {
      metrics,
      insights: [
        {
          title: 'Top Category Spending',
          type: 'info',
          summary: metrics.topCategory
            ? `${metrics.topCategory.category} accounted for ${metrics.topCategory.shareOfTotal}% of total spending.`
            : 'No transactions yet.'
        }
      ],
      aiAnalysis: `Total spending for ${metrics.month} is ${userCurrency} ${metrics.currentExpense} with ${metrics.transactionCount} transactions.`
    };
  }
};

module.exports = {
  computeFinancialMetrics,
  generateSpendingInsights
};
