const mongoose = require('mongoose');
const { TRANSACTION_TYPES } = require('../config/constants');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [TRANSACTION_TYPES.INCOME, TRANSACTION_TYPES.EXPENSE],
      required: true
    },
    icon: {
      type: String,
      default: 'Tag'
    },
    color: {
      type: String,
      default: '#6366F1'
    },
    isCustom: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
