const { z } = require('zod');
const { TRANSACTION_TYPES, PAYMENT_METHODS } = require('../config/constants');

const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE]),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().optional().default('INR'),
    category: z.string().min(1, 'Category is required'),
    merchant: z.string().optional().default(''),
    description: z.string().min(1, 'Description is required'),
    date: z.string().or(z.date()).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Other'),
    notes: z.string().optional().default(''),
    isRecurring: z.boolean().optional().default(false),
    recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'none']).optional().default('none'),
    tags: z.array(z.string()).optional().default([])
  })
});

const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Transaction ID is required')
  }),
  body: z.object({
    type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE]).optional(),
    amount: z.number().positive('Amount must be positive').optional(),
    currency: z.string().optional(),
    category: z.string().min(1).optional(),
    merchant: z.string().optional(),
    description: z.string().min(1).optional(),
    date: z.string().or(z.date()).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    notes: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'none']).optional(),
    tags: z.array(z.string()).optional()
  })
});

const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
    search: z.string().optional(),
    type: z.enum([TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE]).optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string().optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    duplicateStatus: z.enum(['none', 'potential', 'reviewed']).optional()
  })
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema
};
