const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Group = require('../models/Group');
const SharedExpense = require('../models/SharedExpense');
const Settlement = require('../models/Settlement');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../config/constants');
const { getCurrentMonthStr } = require('./dateUtils');

const seedData = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spendsense';
  await mongoose.connect(mongoURI);
  console.log('[Seed] Connected to MongoDB');

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    Group.deleteMany({}),
    SharedExpense.deleteMany({}),
    Settlement.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('[Seed] Cleared old data');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Create primary demo user and roommates
  const primaryUser = await User.create({
    name: 'Het Modi',
    email: 'demo@spendsense.ai',
    passwordHash,
    currency: 'INR',
    monthlyIncome: 85000,
    monthlyBudget: 50000,
    timezone: 'Asia/Kolkata',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  });

  const roommate1 = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul@spendsense.ai',
    passwordHash,
    currency: 'INR',
    monthlyIncome: 65000,
    monthlyBudget: 40000
  });

  const roommate2 = await User.create({
    name: 'Jay Patel',
    email: 'jay@spendsense.ai',
    passwordHash,
    currency: 'INR',
    monthlyIncome: 70000,
    monthlyBudget: 45000
  });

  const currentMonth = getCurrentMonthStr();
  const now = new Date();

  // Create current month transactions for Het
  const transactions = [
    {
      userId: primaryUser._id,
      type: 'income',
      amount: 85000,
      currency: 'INR',
      category: 'Salary',
      merchant: 'Tech Innovations Ltd',
      description: 'Monthly Salary Credit',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      paymentMethod: 'Bank Transfer'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 18000,
      currency: 'INR',
      category: 'Housing',
      merchant: 'Green Apartments',
      description: 'Monthly Apartment Rent',
      date: new Date(now.getFullYear(), now.getMonth(), 2),
      paymentMethod: 'Bank Transfer'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 4500,
      currency: 'INR',
      category: 'Bills',
      merchant: 'Torrent Power',
      description: 'Electricity & Broadband Bill',
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      paymentMethod: 'UPI'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 6200,
      currency: 'INR',
      category: 'Food',
      merchant: 'Swiggy & Dining',
      description: 'Weekly Dinners & Grocery',
      date: new Date(now.getFullYear(), now.getMonth(), 7),
      paymentMethod: 'UPI'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 3200,
      currency: 'INR',
      category: 'Transportation',
      merchant: 'Uber & Fuel',
      description: 'Cab rides and city commute',
      date: new Date(now.getFullYear(), now.getMonth(), 8),
      paymentMethod: 'Debit Card'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 4200,
      currency: 'INR',
      category: 'Shopping',
      merchant: 'Amazon',
      description: 'Noise Cancelling Headphones',
      date: new Date(now.getFullYear(), now.getMonth(), 10),
      paymentMethod: 'Credit Card'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 999,
      currency: 'INR',
      category: 'Subscriptions',
      merchant: 'Netflix & Spotify',
      description: 'Entertainment OTT Subscriptions',
      date: new Date(now.getFullYear(), now.getMonth(), 11),
      paymentMethod: 'Credit Card'
    },
    {
      userId: primaryUser._id,
      type: 'expense',
      amount: 1500,
      currency: 'INR',
      category: 'Healthcare',
      merchant: 'Apollo Pharmacy',
      description: 'Monthly health checkup supplements',
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      paymentMethod: 'UPI'
    }
  ];

  await Transaction.insertMany(transactions);

  // Create Budget for current month
  await Budget.create({
    userId: primaryUser._id,
    month: currentMonth,
    totalBudget: 50000,
    categoryBudgets: [
      { category: 'Housing', limit: 20000 },
      { category: 'Food', limit: 10000 },
      { category: 'Transportation', limit: 5000 },
      { category: 'Bills', limit: 6000 },
      { category: 'Shopping', limit: 5000 },
      { category: 'Subscriptions', limit: 2000 },
      { category: 'Healthcare', limit: 2000 }
    ]
  });

  // Create Shared Apartment Group
  const group = await Group.create({
    name: 'Skyline Flatmates 402',
    description: 'Shared rent, electricity, wifi and groceries',
    currency: 'INR',
    createdBy: primaryUser._id,
    members: [
      {
        userId: primaryUser._id,
        name: primaryUser.name,
        email: primaryUser.email,
        role: 'admin',
        status: 'active'
      },
      {
        userId: roommate1._id,
        name: roommate1.name,
        email: roommate1.email,
        role: 'member',
        status: 'active'
      },
      {
        userId: roommate2._id,
        name: roommate2.name,
        email: roommate2.email,
        role: 'member',
        status: 'active'
      }
    ]
  });

  // Shared Expense 1: ₹3000 Electricity bill paid by Het, split equally 3 ways
  await SharedExpense.create({
    groupId: group._id,
    title: 'Monthly Electricity & Water Bill',
    amount: 3000,
    currency: 'INR',
    category: 'Bills',
    paidBy: primaryUser._id,
    splitType: 'equal',
    splits: [
      { userId: primaryUser._id, amount: 1000, percentage: 33.33 },
      { userId: roommate1._id, amount: 1000, percentage: 33.33 },
      { userId: roommate2._id, amount: 1000, percentage: 33.34 }
    ],
    date: new Date(now.getFullYear(), now.getMonth(), 4),
    createdBy: primaryUser._id
  });

  // Shared Expense 2: ₹1800 Groceries paid by Rahul, split equally
  await SharedExpense.create({
    groupId: group._id,
    title: 'Weekend Cooking Groceries',
    amount: 1800,
    currency: 'INR',
    category: 'Food',
    paidBy: roommate1._id,
    splitType: 'equal',
    splits: [
      { userId: primaryUser._id, amount: 600, percentage: 33.33 },
      { userId: roommate1._id, amount: 600, percentage: 33.33 },
      { userId: roommate2._id, amount: 600, percentage: 33.34 }
    ],
    date: new Date(now.getFullYear(), now.getMonth(), 6),
    createdBy: roommate1._id
  });

  // Create a notification for Het
  await Notification.create({
    userId: primaryUser._id,
    type: NOTIFICATION_TYPES.GROUP_EXPENSE,
    title: 'New Group Expense Added',
    message: 'Rahul Sharma added "Weekend Cooking Groceries" for ₹1,800. Your share is ₹600.',
    data: { groupId: group._id }
  });

  console.log('[Seed] Database successfully seeded with demo accounts and transactions!');
  console.log('[Seed] Demo Login: demo@spendsense.ai / password123');
  await mongoose.disconnect();
};

seedData().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
