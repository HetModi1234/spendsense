const { z } = require('zod');
const { TRANSACTION_TYPES, PAYMENT_METHODS, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } = require('../config/constants');

const parseExpenseInputSchema = z.object({
  body: z.object({
    text: z.string().min(3, 'Expense text must be at least 3 characters').max(500)
  })
});

// Schema to strictly validate the structured JSON returned by Gemini
const geminiParsedExpenseSchema = z.object({
  type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE]).default(TRANSACTION_TYPES.EXPENSE),
  amount: z.number().positive('Parsed amount must be a positive number'),
  currency: z.string().default('INR'),
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().default(''),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('Other'),
  date: z.string().min(10, 'A valid date string is required')
});

const chatInputSchema = z.object({
  body: z.object({
    conversationId: z.string().optional(),
    message: z.string().min(1, 'Message cannot be empty').max(1000)
  })
});

const forecastInputSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format').optional()
  }).optional()
});

module.exports = {
  parseExpenseInputSchema,
  geminiParsedExpenseSchema,
  chatInputSchema,
  forecastInputSchema
};
