const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    limit: {
      type: Number,
      required: true,
      min: [0, 'Category budget limit cannot be negative']
    },
    spent: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    month: {
      type: String, // e.g. "2026-11"
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
      index: true
    },
    totalBudget: {
      type: Number,
      required: true,
      min: [0, 'Total budget cannot be negative']
    },
    categoryBudgets: {
      type: [categoryBudgetSchema],
      default: []
    },
    alertsTriggered: [
      {
        type: { type: String },
        category: { type: String, default: 'Total' },
        percentage: { type: Number },
        triggeredAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
