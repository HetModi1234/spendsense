const { z } = require('zod');

const createOrUpdateBudgetSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'),
    totalBudget: z.number().nonnegative('Total budget must be non-negative'),
    categoryBudgets: z.array(
      z.object({
        category: z.string().min(1, 'Category is required'),
        limit: z.number().nonnegative('Category limit must be non-negative')
      })
    ).optional().default([])
  })
});

module.exports = {
  createOrUpdateBudgetSchema
};
