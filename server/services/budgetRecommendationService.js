const Transaction = require('../models/Transaction');
const { getMonthDateRange, getPreviousMonthStr, getCurrentMonthStr } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');
const { getGenerativeModel, isGeminiConfigured } = require('./geminiService');

/**
 * Calculates budget recommendations based on past 3 months average spending.
 */
const getBudgetRecommendations = async (userId, userCurrency = 'INR') => {
  const currentMonth = getCurrentMonthStr();
  const m1 = getPreviousMonthStr(currentMonth);
  const m2 = getPreviousMonthStr(m1);
  const m3 = getPreviousMonthStr(m2);

  const rangeStart = getMonthDateRange(m3).startDate;
  const rangeEnd = getMonthDateRange(currentMonth).endDate;

  const pastExpenses = await Transaction.find({
    userId,
    type: 'expense',
    date: { $gte: rangeStart, $lte: rangeEnd }
  }).lean();

  const categoryTotals = {};
  const monthCategoryMap = {}; // { 'YYYY-MM': { 'Food': 120 } }

  pastExpenses.forEach(t => {
    const monthKey = new Date(t.date).toISOString().slice(0, 7);
    if (!monthCategoryMap[monthKey]) monthCategoryMap[monthKey] = {};
    monthCategoryMap[monthKey][t.category] = (monthCategoryMap[monthKey][t.category] || 0) + t.amount;
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const distinctMonths = Object.keys(monthCategoryMap);
  const monthCount = Math.max(1, distinctMonths.length);

  const categoryRecommendations = Object.entries(categoryTotals).map(([category, total]) => {
    const averageSpent = roundNumber(total / monthCount);
    // Recommend average + 10% buffer for flexibility rounded to nearest 50
    let recommended = Math.ceil((averageSpent * 1.1) / 50) * 50;
    if (recommended < 100) recommended = 100;

    return {
      category,
      averageSpent,
      recommendedLimit: recommended,
      rationale: `Based on your monthly average of ${userCurrency} ${averageSpent} over the last ${monthCount} month(s), with a 10% buffer.`
    };
  }).sort((a, b) => b.recommendedLimit - a.recommendedLimit);

  const recommendedTotalBudget = categoryRecommendations.reduce((acc, curr) => acc + curr.recommendedLimit, 0);

  const recommendationResult = {
    analyzedMonths: distinctMonths,
    monthCount,
    recommendedTotalBudget,
    categoryRecommendations
  };

  if (!isGeminiConfigured()) {
    recommendationResult.aiSummary = `Suggested monthly budget of ${userCurrency} ${recommendedTotalBudget} across ${categoryRecommendations.length} categories based on your historical spending trends.`;
    return recommendationResult;
  }

  try {
    const model = getGenerativeModel();
    const prompt = `
Based on these historical monthly average expenditures, provide a 2-sentence rationale for the suggested budget targets:
Total Suggested Budget: ${userCurrency} ${recommendedTotalBudget}
Categories: ${JSON.stringify(categoryRecommendations.slice(0, 5))}
`;
    const res = await model.generateContent(prompt);
    recommendationResult.aiSummary = res.response.text().trim();
  } catch (err) {
    recommendationResult.aiSummary = `Historical budget allocation calculated across ${categoryRecommendations.length} active spending categories.`;
  }

  return recommendationResult;
};

module.exports = {
  getBudgetRecommendations
};
