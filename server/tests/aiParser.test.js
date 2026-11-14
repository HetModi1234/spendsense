const { geminiParsedExpenseSchema } = require('../validators/aiValidator');
const { fallbackRegexParse } = require('../services/expenseParserService');

describe('AI Expense Parser & Zod Validation', () => {
  it('should validate a correct Gemini structured output with Zod', () => {
    const validGeminiOutput = {
      type: 'expense',
      amount: 350,
      currency: 'INR',
      description: "Dinner at Domino's",
      merchant: "Domino's",
      category: 'Food',
      paymentMethod: 'UPI',
      date: '2026-11-13'
    };

    const validated = geminiParsedExpenseSchema.parse(validGeminiOutput);
    expect(validated.amount).toBe(350);
    expect(validated.category).toBe('Food');
    expect(validated.merchant).toBe("Domino's");
    expect(validated.paymentMethod).toBe('UPI');
  });

  it('should reject invalid or negative amounts in Zod schema', () => {
    const invalidOutput = {
      type: 'expense',
      amount: -150,
      currency: 'INR',
      description: 'Bad amount',
      merchant: 'Store',
      category: 'Food',
      paymentMethod: 'UPI',
      date: '2026-11-13'
    };

    expect(() => geminiParsedExpenseSchema.parse(invalidOutput)).toThrow();
  });

  it('should parse natural-language text with deterministic fallback parser', () => {
    const input = "Paid 350 rupees for dinner at Domino's using UPI yesterday.";
    const result = fallbackRegexParse(input, 'INR');

    expect(result.amount).toBe(350);
    expect(result.category).toBe('Food');
    expect(result.paymentMethod).toBe('UPI');
    expect(result.merchant).toBe("Domino's");
  });
});
