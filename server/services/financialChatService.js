const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Group = require('../models/Group');
const AIConversation = require('../models/AIConversation');
const { computeFinancialMetrics } = require('./financialInsightsService');
const { computeForecast } = require('./forecastService');
const { calculateGroupBalances } = require('./sharedExpenseService');
const { getCurrentMonthStr, getMonthDateRange, getPreviousMonthStr } = require('../utils/dateUtils');
const { roundNumber, formatCurrency } = require('../utils/currencyUtils');
const { getGeminiClient, isGeminiConfigured, SYSTEM_INSTRUCTION } = require('./geminiService');

/**
 * Backend tool implementations.
 * Every tool receives the authenticated userId from backend context.
 */
const backendTools = {
  getMonthlySummary: async (userId, args = {}) => {
    const month = args.month || getCurrentMonthStr();
    const metrics = await computeFinancialMetrics(userId, month);
    return {
      cardType: 'MonthlySummaryCard',
      data: {
        month: metrics.month,
        income: metrics.currentIncome,
        expenses: metrics.currentExpense,
        savings: metrics.currentSavings,
        savingsRate: metrics.savingsRate,
        transactionCount: metrics.transactionCount,
        budgetUtilization: metrics.budgetUtilization
      }
    };
  },

  getCategorySpending: async (userId, args = {}) => {
    const month = args.month || getCurrentMonthStr();
    const range = getMonthDateRange(month);
    const query = {
      userId,
      type: 'expense',
      date: { $gte: range.startDate, $lte: range.endDate }
    };
    if (args.category) {
      query.category = new RegExp(`^${args.category}$`, 'i');
    }

    const expenses = await Transaction.find(query).lean();
    const total = roundNumber(expenses.reduce((acc, t) => acc + t.amount, 0));

    return {
      cardType: 'CategorySpendingCard',
      data: {
        month,
        category: args.category || 'All Categories',
        totalSpent: total,
        transactionCount: expenses.length,
        transactions: expenses.slice(0, 5).map(t => ({
          description: t.description,
          amount: t.amount,
          date: new Date(t.date).toISOString().split('T')[0],
          merchant: t.merchant
        }))
      }
    };
  },

  getTransactionHistory: async (userId, args = {}) => {
    const limit = Math.min(Number(args.limit) || 10, 20);
    const query = { userId };

    if (args.type) query.type = args.type;
    if (args.category) query.category = new RegExp(args.category, 'i');
    if (args.startDate || args.endDate) {
      query.date = {};
      if (args.startDate) query.date.$gte = new Date(args.startDate);
      if (args.endDate) query.date.$lte = new Date(args.endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return {
      cardType: 'TransactionListCard',
      data: {
        count: transactions.length,
        transactions: transactions.map(t => ({
          id: t._id,
          type: t.type,
          description: t.description,
          merchant: t.merchant,
          category: t.category,
          amount: t.amount,
          date: new Date(t.date).toISOString().split('T')[0],
          paymentMethod: t.paymentMethod
        }))
      }
    };
  },

  compareMonthlySpending: async (userId, args = {}) => {
    const month1 = args.month1 || getCurrentMonthStr();
    const month2 = args.month2 || getPreviousMonthStr(month1);

    const [m1, m2] = await Promise.all([
      computeFinancialMetrics(userId, month1),
      computeFinancialMetrics(userId, month2)
    ]);

    const expenseDiff = roundNumber(m1.currentExpense - m2.currentExpense);
    const percentDiff = m2.currentExpense > 0
      ? roundNumber(((m1.currentExpense - m2.currentExpense) / m2.currentExpense) * 100, 1)
      : 0;

    return {
      cardType: 'ComparisonCard',
      data: {
        currentMonth: month1,
        comparedMonth: month2,
        currentExpense: m1.currentExpense,
        comparedExpense: m2.currentExpense,
        difference: expenseDiff,
        percentChange: percentDiff,
        increased: expenseDiff > 0
      }
    };
  },

  getBudgetStatus: async (userId, args = {}) => {
    const month = args.month || getCurrentMonthStr();
    const budget = await Budget.findOne({ userId, month }).lean();
    const metrics = await computeFinancialMetrics(userId, month);

    const totalBudget = budget ? budget.totalBudget : 0;
    const remaining = roundNumber(Math.max(0, totalBudget - metrics.currentExpense));
    const utilization = totalBudget > 0 ? roundNumber((metrics.currentExpense / totalBudget) * 100, 1) : 0;

    return {
      cardType: 'BudgetStatusCard',
      data: {
        month,
        totalBudget,
        spent: metrics.currentExpense,
        remaining,
        utilization,
        status: utilization >= 100 ? 'Exceeded' : utilization >= 90 ? 'Critical' : utilization >= 75 ? 'Warning' : 'Healthy',
        categoryBudgets: (budget?.categoryBudgets || []).map(cb => {
          const catSpent = metrics.categoryBreakdown.find(c => c.category === cb.category)?.currentSpent || 0;
          return {
            category: cb.category,
            limit: cb.limit,
            spent: catSpent,
            percent: cb.limit > 0 ? roundNumber((catSpent / cb.limit) * 100, 1) : 0
          };
        })
      }
    };
  },

  getTopExpenses: async (userId, args = {}) => {
    const limit = Math.min(Number(args.limit) || 5, 10);
    const month = args.month || getCurrentMonthStr();
    const range = getMonthDateRange(month);

    const top = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: range.startDate, $lte: range.endDate }
    })
      .sort({ amount: -1 })
      .limit(limit)
      .lean();

    return {
      cardType: 'TopExpensesCard',
      data: {
        month,
        topExpenses: top.map(t => ({
          description: t.description,
          merchant: t.merchant,
          amount: t.amount,
          category: t.category,
          date: new Date(t.date).toISOString().split('T')[0]
        }))
      }
    };
  },

  getSpendingProjection: async (userId, args = {}) => {
    const month = args.month || getCurrentMonthStr();
    const forecast = await computeForecast(userId, month);
    return {
      cardType: 'ForecastCard',
      data: forecast
    };
  },

  getGroupBalances: async (userId) => {
    const groups = await Group.find({ 'members.userId': userId }).lean();
    const groupSummaries = [];

    for (const g of groups) {
      try {
        const bal = await calculateGroupBalances(g._id);
        const myBal = bal.memberBalances.find(m => String(m.member.id) === String(userId));
        groupSummaries.push({
          groupId: g._id,
          groupName: g.name,
          currency: g.currency,
          myNetBalance: myBal ? myBal.netBalance : 0,
          status: myBal ? myBal.status : 'settled'
        });
      } catch (e) {
        // Ignore single group error
      }
    }

    return {
      cardType: 'GroupBalancesCard',
      data: {
        groups: groupSummaries
      }
    };
  }
};

/**
 * Tool declarations for Gemini Function Calling
 */
const geminiFunctionDeclarations = [
  {
    name: 'getMonthlySummary',
    description: 'Get financial summary for a month including total income, total expenses, net savings, and budget utilization.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: { type: 'STRING', description: 'Month in YYYY-MM format. Defaults to current month.' }
      }
    }
  },
  {
    name: 'getCategorySpending',
    description: 'Get total spending and recent transactions for a specific category or all categories in a month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: { type: 'STRING', description: 'Month in YYYY-MM format.' },
        category: { type: 'STRING', description: 'Expense category name like Food, Transportation, Shopping, Housing, etc.' }
      }
    }
  },
  {
    name: 'getTransactionHistory',
    description: 'Get recent transactions filtered by type, category, or date range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Max records to fetch (up to 20).' },
        category: { type: 'STRING', description: 'Filter by category.' },
        type: { type: 'STRING', description: 'Filter by income or expense.' }
      }
    }
  },
  {
    name: 'compareMonthlySpending',
    description: 'Compare financial spending between two months to identify changes and trends.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month1: { type: 'STRING', description: 'First month in YYYY-MM format.' },
        month2: { type: 'STRING', description: 'Second month in YYYY-MM format to compare against.' }
      }
    }
  },
  {
    name: 'getBudgetStatus',
    description: 'Get monthly budget status, limits, remaining allowance, and category breakdown.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: { type: 'STRING', description: 'Month in YYYY-MM format.' }
      }
    }
  },
  {
    name: 'getTopExpenses',
    description: 'Get the largest individual expense transactions for a given month.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: { type: 'STRING', description: 'Month in YYYY-MM format.' },
        limit: { type: 'NUMBER', description: 'Number of top expenses, e.g. 5.' }
      }
    }
  },
  {
    name: 'getSpendingProjection',
    description: 'Get estimated month-end spending forecast based on daily run rate and category velocity.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month: { type: 'STRING', description: 'Month in YYYY-MM format.' }
      }
    }
  },
  {
    name: 'getGroupBalances',
    description: 'Get net balances and amounts owed across all shared roommate/expense groups.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  }
];

/**
 * Fallback intent detector when Gemini API key is not configured.
 * Uses deterministic tool calling and response synthesis.
 */
const handleFallbackChat = async (userId, userMessage, userCurrency = 'INR') => {
  const lower = userMessage.toLowerCase();
  const cards = [];
  let responseText = '';

  if (lower.includes('budget') || lower.includes('limit') || lower.includes('afford') || lower.includes('exceed')) {
    const res = await backendTools.getBudgetStatus(userId, {});
    cards.push({ type: res.cardType, title: 'Budget Status', data: res.data });
    const { totalBudget, spent, remaining, utilization, status } = res.data;
    responseText = `Your total budget for this month is ${formatCurrency(totalBudget, userCurrency)}. You have spent ${formatCurrency(spent, userCurrency)} (${utilization}% utilized). Remaining budget: ${formatCurrency(remaining, userCurrency)}. Status: **${status}**.`;
  } else if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant')) {
    const res = await backendTools.getCategorySpending(userId, { category: 'Food' });
    cards.push({ type: res.cardType, title: 'Food Spending', data: res.data });
    responseText = `You have spent ${formatCurrency(res.data.totalSpent, userCurrency)} on **Food** across ${res.data.transactionCount} transactions this month.`;
  } else if (lower.includes('shopping') || lower.includes('amazon') || lower.includes('clothes')) {
    const res = await backendTools.getCategorySpending(userId, { category: 'Shopping' });
    cards.push({ type: res.cardType, title: 'Shopping Spending', data: res.data });
    responseText = `You have spent ${formatCurrency(res.data.totalSpent, userCurrency)} on **Shopping** this month.`;
  } else if (lower.includes('compare') || lower.includes('last month') || lower.includes('increase')) {
    const res = await backendTools.compareMonthlySpending(userId, {});
    cards.push({ type: res.cardType, title: 'Month-over-Month Comparison', data: res.data });
    responseText = `Comparison between ${res.data.currentMonth} and ${res.data.comparedMonth}: Spending ${res.data.increased ? 'increased' : 'decreased'} by ${formatCurrency(Math.abs(res.data.difference), userCurrency)} (${Math.abs(res.data.percentChange)}%).`;
  } else if (lower.includes('forecast') || lower.includes('projection') || lower.includes('projected') || lower.includes('month end')) {
    const res = await backendTools.getSpendingProjection(userId, {});
    cards.push({ type: res.cardType, title: 'Spending Forecast', data: res.data });
    if (res.data.hasData) {
      responseText = `At your daily run rate of ${formatCurrency(res.data.metrics.dailyRunRate, userCurrency)}/day, your projected month-end expenses are ${formatCurrency(res.data.metrics.projectedTotal, userCurrency)}.`;
    } else {
      responseText = res.data.message;
    }
  } else if (lower.includes('largest') || lower.includes('top') || lower.includes('highest') || lower.includes('big')) {
    const res = await backendTools.getTopExpenses(userId, { limit: 5 });
    cards.push({ type: res.cardType, title: 'Top Expenses', data: res.data });
    responseText = `Here are your largest expenses for this month.`;
  } else if (lower.includes('group') || lower.includes('roommate') || lower.includes('split') || lower.includes('owe')) {
    const res = await backendTools.getGroupBalances(userId);
    cards.push({ type: res.cardType, title: 'Group Balances', data: res.data });
    responseText = `Checked your shared expense groups and calculated active balances.`;
  } else {
    // Default to monthly summary
    const res = await backendTools.getMonthlySummary(userId, {});
    cards.push({ type: res.cardType, title: 'Monthly Summary', data: res.data });
    responseText = `Here is your current monthly overview: Total Income is ${formatCurrency(res.data.income, userCurrency)}, Total Expenses are ${formatCurrency(res.data.expenses, userCurrency)}, leaving Net Savings of ${formatCurrency(res.data.savings, userCurrency)} (${res.data.savingsRate}% savings rate).`;
  }

  return {
    content: responseText,
    cards,
    toolCalls: []
  };
};

/**
 * Builds and sanitizes chat history for Google Gemini.
 * Gemini strictly requires:
 * 1. History MUST start with role 'user'.
 * 2. Roles MUST alternate between 'user' and 'model'.
 * 3. History MUST end with role 'model' before chat.sendMessage(userMessage).
 */
const buildGeminiChatHistory = (pastMessages, maxPast = 10) => {
  const slice = pastMessages.slice(-maxPast);
  const formatted = [];

  for (const m of slice) {
    if (!m.content || typeof m.content !== 'string' || !m.content.trim()) continue;
    const role = m.role === 'model' ? 'model' : 'user';

    if (formatted.length === 0) {
      if (role === 'user') {
        formatted.push({ role: 'user', parts: [{ text: m.content }] });
      }
    } else {
      const prevRole = formatted[formatted.length - 1].role;
      if (role !== prevRole) {
        formatted.push({ role, parts: [{ text: m.content }] });
      }
    }
  }

  if (formatted.length > 0 && formatted[formatted.length - 1].role === 'user') {
    formatted.pop();
  }

  return formatted;
};

/**
 * Processes a chat message with Google Gemini function/tool calling.
 */
const processUserChatMessage = async (userId, userMessage, conversationId = null, userCurrency = 'INR') => {
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({ _id: conversationId, userId });
  }

  if (!conversation) {
    conversation = await AIConversation.create({
      userId,
      title: userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : ''),
      messages: []
    });
  }

  // Push user message
  conversation.messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  });

  // Check Gemini configuration
  if (!isGeminiConfigured()) {
    const fallbackResponse = await handleFallbackChat(userId, userMessage, userCurrency);

    conversation.messages.push({
      role: 'model',
      content: `${fallbackResponse.content}\n\n*(Note: Running with deterministic financial query engine. Add \`GEMINI_API_KEY\` in \`server/.env\` for live multi-turn conversational AI reasoning).*`,
      cards: fallbackResponse.cards,
      toolCalls: fallbackResponse.toolCalls,
      timestamp: new Date()
    });

    await conversation.save();
    return {
      conversationId: conversation._id,
      response: conversation.messages[conversation.messages.length - 1],
      allMessages: conversation.messages
    };
  }

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: geminiFunctionDeclarations }]
    });

    // Build sanitized chat history from past messages (excluding the current user message)
    const history = buildGeminiChatHistory(conversation.messages.slice(0, -1), 10);

    const chat = model.startChat({ history });

    let result = await chat.sendMessage(userMessage);
    let response = result.response;

    const cards = [];
    const toolCallsRecorded = [];

    // Check if the model called functions
    let functionCalls = response.functionCalls ? response.functionCalls() : [];

    while (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const fnName = call.name;
      const fnArgs = call.args || {};

      if (backendTools[fnName]) {
        // ALWAYS pass authenticated userId from request context
        const toolOutput = await backendTools[fnName](userId, fnArgs);

        if (toolOutput.cardType) {
          cards.push({
            type: toolOutput.cardType,
            title: fnName,
            data: toolOutput.data
          });
        }

        toolCallsRecorded.push({
          toolName: fnName,
          args: fnArgs,
          result: toolOutput.data
        });

        // Send tool response back to Gemini
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: fnName,
              response: { result: toolOutput.data }
            }
          }
        ]);

        response = result.response;
        functionCalls = response.functionCalls ? response.functionCalls() : [];
      } else {
        break;
      }
    }

    const finalAnswer = response.text() || 'Here is your financial summary:';

    const assistantMsg = {
      role: 'model',
      content: finalAnswer,
      cards,
      toolCalls: toolCallsRecorded,
      timestamp: new Date()
    };

    conversation.messages.push(assistantMsg);
    await conversation.save();

    return {
      conversationId: conversation._id,
      response: assistantMsg,
      allMessages: conversation.messages
    };
  } catch (err) {
    console.error('[Gemini Chat Execution Error]:', err.message);
    const fallbackResponse = await handleFallbackChat(userId, userMessage, userCurrency);

    const errorAssistantMsg = {
      role: 'model',
      content: `${fallbackResponse.content}\n\n*(AI Chat fallback used due to API error: ${err.message})*`,
      cards: fallbackResponse.cards,
      toolCalls: fallbackResponse.toolCalls,
      timestamp: new Date()
    };

    conversation.messages.push(errorAssistantMsg);
    await conversation.save();

    return {
      conversationId: conversation._id,
      response: errorAssistantMsg,
      allMessages: conversation.messages
    };
  }
};

module.exports = {
  processUserChatMessage,
  backendTools
};
