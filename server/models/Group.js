const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['active', 'invited'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    members: {
      type: [memberSchema],
      validate: [val => val.length > 0, 'Group must have at least one member']
    }
  },
  {
    timestamps: true
  }
);

groupSchema.index({ 'members.userId': 1 });
groupSchema.index({ 'members.email': 1 });

module.exports = mongoose.model('Group', groupSchema);
