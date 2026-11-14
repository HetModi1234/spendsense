const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true
    },
    title: String,
    data: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    toolCalls: [
      {
        toolName: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
      }
    ],
    cards: [cardSchema]
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Financial Chat',
      trim: true
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('AIConversation', aiConversationSchema);
