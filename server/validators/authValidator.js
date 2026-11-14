const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    currency: z.string().optional().default('INR'),
    monthlyIncome: z.number().nonnegative().optional().default(0),
    monthlyBudget: z.number().nonnegative().optional().default(0)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),
  params: z.object({
    token: z.string().min(1, 'Token is required')
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    avatar: z.string().optional(),
    currency: z.string().optional(),
    monthlyIncome: z.number().nonnegative().optional(),
    monthlyBudget: z.number().nonnegative().optional(),
    timezone: z.string().optional(),
    preferences: z.object({
      firstDayOfMonth: z.number().int().min(1).max(28).optional(),
      theme: z.enum(['dark', 'light']).optional(),
      preferredCategories: z.array(z.string()).optional()
    }).optional()
  })
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema
};
