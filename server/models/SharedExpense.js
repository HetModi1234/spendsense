const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const sharedExpenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    category: {
      type: String,
      default: 'Other',
      trim: true
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal'
    },
    splits: {
      type: [splitSchema],
      required: true
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

sharedExpenseSchema.index({ groupId: 1, date: -1 });

module.exports = mongoose.model('SharedExpense', sharedExpenseSchema);
