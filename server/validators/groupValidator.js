const { z } = require('zod');

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required').max(100),
    description: z.string().optional().default(''),
    currency: z.string().optional().default('INR'),
    memberEmails: z.array(z.string().email('Invalid email')).optional().default([])
  })
});

const inviteMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required')
  }),
  body: z.object({
    email: z.string().email('Valid email is required'),
    name: z.string().min(1, 'Name is required').optional()
  })
});

const addSharedExpenseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required')
  }),
  body: z.object({
    title: z.string().min(1, 'Expense title is required'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().optional().default('INR'),
    category: z.string().optional().default('Other'),
    paidBy: z.string().min(1, 'Payer ID is required'),
    splitType: z.enum(['equal', 'exact', 'percentage']).default('equal'),
    splits: z.array(
      z.object({
        userId: z.string().min(1, 'Member user ID is required'),
        amount: z.number().nonnegative().optional(),
        percentage: z.number().nonnegative().optional()
      })
    ).min(1, 'At least one member must be included in split'),
    date: z.string().or(z.date()).optional(),
    notes: z.string().optional().default('')
  })
});

const recordSettlementSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Group ID is required')
  }),
  body: z.object({
    payerId: z.string().min(1, 'Payer ID is required'),
    payeeId: z.string().min(1, 'Payee ID is required'),
    amount: z.number().positive('Settlement amount must be positive'),
    currency: z.string().optional().default('INR'),
    paymentMethod: z.string().optional().default('UPI'),
    notes: z.string().optional().default('')
  })
});

module.exports = {
  createGroupSchema,
  inviteMemberSchema,
  addSharedExpenseSchema,
  recordSettlementSchema
};
