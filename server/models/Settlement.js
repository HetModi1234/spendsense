const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true
    },
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    payeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: [0.01, 'Amount must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    paymentMethod: {
      type: String,
      default: 'UPI'
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'settled'
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    settledAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

settlementSchema.index({ groupId: 1, settledAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);
