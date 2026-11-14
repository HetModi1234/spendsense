const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelancing',
  'Business',
  'Investments',
  'Gifts',
  'Other income'
];

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Shopping',
  'Transportation',
  'Housing',
  'Bills',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'Personal care',
  'Other'
];

const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Other'
];

const BUDGET_THRESHOLDS = {
  INFO: 50,
  WARNING: 75,
  CRITICAL: 90,
  EXCEEDED: 100
};

const NOTIFICATION_TYPES = {
  BUDGET_THRESHOLD: 'budget_threshold',
  BUDGET_EXCEEDED: 'budget_exceeded',
  DUPLICATE_TRANSACTION: 'duplicate_detected',
  GROUP_INVITE: 'group_invite',
  GROUP_EXPENSE: 'group_expense',
  SETTLEMENT: 'settlement',
  MONTHLY_REPORT: 'monthly_report'
};

const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' }
};

const CATEGORY_METADATA = {
  Food: { icon: 'Utensils', color: '#F97316' },
  Shopping: { icon: 'ShoppingBag', color: '#EC4899' },
  Transportation: { icon: 'Car', color: '#3B82F6' },
  Housing: { icon: 'Home', color: '#10B981' },
  Bills: { icon: 'Receipt', color: '#EF4444' },
  Healthcare: { icon: 'HeartPulse', color: '#14B8A6' },
  Education: { icon: 'GraduationCap', color: '#8B5CF6' },
  Entertainment: { icon: 'Film', color: '#F59E0B' },
  Travel: { icon: 'Plane', color: '#06B6D4' },
  Subscriptions: { icon: 'Repeat', color: '#6366F1' },
  'Personal care': { icon: 'Smile', color: '#D946EF' },
  Other: { icon: 'MoreHorizontal', color: '#64748B' },
  Salary: { icon: 'Briefcase', color: '#22C55E' },
  Freelancing: { icon: 'Laptop', color: '#3B82F6' },
  Business: { icon: 'Building2', color: '#8B5CF6' },
  Investments: { icon: 'TrendingUp', color: '#10B981' },
  Gifts: { icon: 'Gift', color: '#F43F5E' },
  'Other income': { icon: 'DollarSign', color: '#EAB308' }
};

module.exports = {
  TRANSACTION_TYPES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  BUDGET_THRESHOLDS,
  NOTIFICATION_TYPES,
  SUPPORTED_CURRENCIES,
  CATEGORY_METADATA
};
