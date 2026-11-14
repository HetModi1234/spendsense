const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password']
    },
    avatar: {
      type: String,
      default: ''
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    monthlyIncome: {
      type: Number,
      default: 0,
      min: [0, 'Monthly income cannot be negative']
    },
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Monthly budget cannot be negative']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    preferences: {
      firstDayOfMonth: {
        type: Number,
        default: 1,
        min: 1,
        max: 28
      },
      theme: {
        type: String,
        enum: ['dark', 'light'],
        default: 'dark'
      },
      preferredCategories: {
        type: [String],
        default: []
      }
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
