const { getGenerativeModel, isGeminiConfigured } = require('./geminiService');
const { geminiParsedExpenseSchema } = require('../validators/aiValidator');
const { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, PAYMENT_METHODS } = require('../config/constants');

/**
 * Deterministic rule-based fallback parser in case Gemini API key is not configured or fails.
 */
const fallbackRegexParse = (text, userCurrency = 'INR') => {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Extract amount
  const amountMatch = clean.match(/(?:(?:rs\.?|inr|\$|€|£|₹)\s*([\d,]+(?:\.\d+)?))|([\d,]+(?:\.\d+)?)\s*(?:rupees|rs\.?|inr|dollars|usd|bucks)?/i);
  let amount = null;
  if (amountMatch) {
    const rawVal = (amountMatch[1] || amountMatch[2] || '').replace(/,/g, '');
    if (rawVal && !isNaN(Number(rawVal)) && Number(rawVal) > 0) {
      amount = parseFloat(rawVal);
    }
  }

  // Determine type
  const isIncome = /\b(salary|received|earned|credited|freelance|dividend|bonus)\b/i.test(lower);
  const type = isIncome ? 'income' : 'expense';

  // Detect payment method
  let paymentMethod = 'Other';
  if (/\bupi\b|gpay|phonepe|paytm/i.test(lower)) paymentMethod = 'UPI';
  else if (/\bcredit\s*card\b/i.test(lower)) paymentMethod = 'Credit Card';
  else if (/\bdebit\s*card\b/i.test(lower)) paymentMethod = 'Debit Card';
  else if (/\bcash\b/i.test(lower)) paymentMethod = 'Cash';
  else if (/\bbank\s*transfer\b|neft|rtgs|imps/i.test(lower)) paymentMethod = 'Bank Transfer';

  // Detect date
  const now = new Date();
  let date = now.toISOString().split('T')[0];
  if (/\byesterday\b/i.test(lower)) {
    const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    date = y.toISOString().split('T')[0];
  } else if (/\btoday\b/i.test(lower)) {
    date = now.toISOString().split('T')[0];
  }

  // Detect category & merchant
  let category = isIncome ? 'Other income' : 'Other';
  let merchant = '';

  if (/domino|swiggy|zomato|mcdonald|kfc|starbucks|dinner|lunch|breakfast|coffee|pizza|burger|food/i.test(lower)) {
    category = 'Food';
    if (/domino/i.test(lower)) merchant = "Domino's";
    else if (/swiggy/i.test(lower)) merchant = 'Swiggy';
    else if (/zomato/i.test(lower)) merchant = 'Zomato';
    else if (/starbucks/i.test(lower)) merchant = 'Starbucks';
  } else if (/uber|ola|metro|fuel|petrol|diesel|flight|train|cab|auto|transport/i.test(lower)) {
    category = 'Transportation';
    if (/uber/i.test(lower)) merchant = 'Uber';
    else if (/ola/i.test(lower)) merchant = 'Ola';
  } else if (/amazon|flipkart|myntra|zara|shopping|mall|clothes|shoes/i.test(lower)) {
    category = 'Shopping';
    if (/amazon/i.test(lower)) merchant = 'Amazon';
    else if (/flipkart/i.test(lower)) merchant = 'Flipkart';
  } else if (/netflix|spotify|prime|youtube|subscription/i.test(lower)) {
    category = 'Subscriptions';
    if (/netflix/i.test(lower)) merchant = 'Netflix';
    else if (/spotify/i.test(lower)) merchant = 'Spotify';
  } else if (/electricity|water|wifi|broadband|recharge|mobile|bill/i.test(lower)) {
    category = 'Bills';
  } else if (/rent|maintenance|house|flat/i.test(lower)) {
    category = 'Housing';
  } else if (/salary|paycheck/i.test(lower)) {
    category = 'Salary';
  }

  return {
    type,
    amount: amount || 0,
    currency: userCurrency,
    description: clean,
    merchant,
    category,
    paymentMethod,
    date,
    parsedBy: 'rule-based-fallback'
  };
};

/**
 * Parses natural-language transaction input using Google Gemini structured output,
 * with strict Zod validation.
 */
const parseExpenseWithAI = async (text, userCurrency = 'INR') => {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!isGeminiConfigured()) {
    const fallback = fallbackRegexParse(text, userCurrency);
    if (!fallback.amount) {
      return {
        success: false,
        needsClarification: true,
        message: 'Could not detect an amount. Please specify the amount spent or received.',
        partialData: fallback
      };
    }
    return {
      success: true,
      data: fallback,
      note: 'Parsed using deterministic parser (Gemini API key not configured in .env).'
    };
  }

  try {
    const model = getGenerativeModel({
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
Extract transaction details from the following user description:
"${text}"

Current Reference Date: ${todayStr}
User Default Currency: ${userCurrency}
Allowed Categories (Expenses): ${DEFAULT_EXPENSE_CATEGORIES.join(', ')}
Allowed Categories (Income): ${DEFAULT_INCOME_CATEGORIES.join(', ')}
Allowed Payment Methods: ${PAYMENT_METHODS.join(', ')}

Return ONLY a valid JSON object matching this exact schema:
{
  "type": "expense" or "income",
  "amount": number (positive, strictly required),
  "currency": string (e.g. "${userCurrency}"),
  "description": string (short descriptive summary),
  "merchant": string (business/person name, or empty string),
  "category": string (must match one of the allowed categories),
  "paymentMethod": string (must match one of the allowed payment methods),
  "date": "YYYY-MM-DD" (resolve relative references like "yesterday", "last Sunday", etc. based on ${todayStr})
}

If no clear amount is present in the text, return:
{
  "error": "MISSING_AMOUNT",
  "message": "Please specify the transaction amount."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parsedJson = JSON.parse(responseText);

    if (parsedJson.error === 'MISSING_AMOUNT') {
      return {
        success: false,
        needsClarification: true,
        message: parsedJson.message || 'Please specify the transaction amount.'
      };
    }

    // Validate with Zod
    const validatedData = geminiParsedExpenseSchema.parse(parsedJson);

    return {
      success: true,
      data: {
        ...validatedData,
        parsedBy: 'gemini-ai'
      }
    };
  } catch (error) {
    console.error('[Gemini Parse Expense Error]:', error.message);
    // Graceful fallback to deterministic parsing
    const fallback = fallbackRegexParse(text, userCurrency);
    if (fallback.amount) {
      return {
        success: true,
        data: fallback,
        note: `AI parse failed (${error.message}). Recovered with deterministic rule parser.`
      };
    }
    return {
      success: false,
      message: 'Failed to parse transaction. Please provide clearer details with amount and category.'
    };
  }
};

module.exports = {
  parseExpenseWithAI,
  fallbackRegexParse
};
