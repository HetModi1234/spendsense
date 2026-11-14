const mongoose = require('mongoose');
const { TRANSACTION_TYPES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, PAYMENT_METHODS } = require('../config/constants');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE],
      required: [true, 'Transaction type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    merchant: {
      type: String,
      default: '',
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Other'
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
      default: 'none'
    },
    tags: {
      type: [String],
      default: []
    },
    duplicateStatus: {
      type: String,
      enum: ['none', 'potential', 'reviewed'],
      default: 'none'
    },
    potentialDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
