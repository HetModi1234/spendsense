const Group = require('../models/Group');
const SharedExpense = require('../models/SharedExpense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculateGroupBalances, computeExpenseSplits } = require('../services/sharedExpenseService');
const { roundNumber } = require('../utils/currencyUtils');
const { NOTIFICATION_TYPES } = require('../config/constants');

// Helper to notify via Socket.IO if available
const emitGroupUpdate = (req, groupId, event, payload) => {
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit(event, payload);
    }
  } catch (e) {
    // Non-blocking socket emission
  }
};

// @desc    Get all groups for the authenticated user
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({
      $or: [
        { 'members.userId': req.user._id },
        { 'members.email': req.user.email.toLowerCase() },
        { createdBy: req.user._id }
      ]
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach basic summary (total expenses count)
    const groupSummaries = await Promise.all(
      groups.map(async (g) => {
        const expenseCount = await SharedExpense.countDocuments({ groupId: g._id });
        return {
          ...g,
          expenseCount
        };
      })
    );

    res.json({
      success: true,
      data: groupSummaries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new shared group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
  try {
    const { name, description = '', currency = req.user.currency || 'INR', memberEmails = [] } = req.body;

    const members = [
      {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email.toLowerCase(),
        avatar: req.user.avatar || '',
        role: 'admin',
        status: 'active',
        joinedAt: new Date()
      }
    ];

    // Look up any registered users among invited emails
    for (const email of memberEmails) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail === req.user.email.toLowerCase()) continue;

      const registeredUser = await User.findOne({ email: cleanEmail });
      members.push({
        userId: registeredUser ? registeredUser._id : null,
        name: registeredUser ? registeredUser.name : cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: registeredUser ? registeredUser.avatar : '',
        role: 'member',
        status: registeredUser ? 'active' : 'invited',
        joinedAt: new Date()
      });

      if (registeredUser) {
        await Notification.create({
          userId: registeredUser._id,
          type: NOTIFICATION_TYPES.GROUP_INVITE,
          title: 'Group Invitation',
          message: `${req.user.name} added you to group "${name}".`,
          data: { groupName: name }
        });
      }
    }

    const group = await Group.create({
      name,
      description,
      currency,
      createdBy: req.user._id,
      members
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group details, members, expenses, and balances
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some(
      m => String(m.userId) === String(req.user._id) || m.email === req.user.email.toLowerCase()
    );

    if (!isMember && String(group.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group.' });
    }

    const [expenses, settlements, balanceData] = await Promise.all([
      SharedExpense.find({ groupId: group._id })
        .populate('paidBy', 'name email avatar')
        .sort({ date: -1 })
        .lean(),
      Settlement.find({ groupId: group._id })
        .populate('payerId', 'name email avatar')
        .populate('payeeId', 'name email avatar')
        .sort({ settledAt: -1 })
        .lean(),
      calculateGroupBalances(group._id)
    ]);

    res.json({
      success: true,
      data: {
        group,
        expenses,
        settlements,
        balances: balanceData.memberBalances,
        suggestedSettlements: balanceData.suggestedSettlements,
        totalExpenses: balanceData.totalExpenses
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Invite a member to a group
// @route   POST /api/groups/:id/invite
// @access  Private
const inviteMember = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const alreadyMember = group.members.some(m => m.email === cleanEmail);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Member is already in this group.' });
    }

    const registeredUser = await User.findOne({ email: cleanEmail });

    group.members.push({
      userId: registeredUser ? registeredUser._id : null,
      name: name || (registeredUser ? registeredUser.name : cleanEmail.split('@')[0]),
      email: cleanEmail,
      avatar: registeredUser ? registeredUser.avatar : '',
      role: 'member',
      status: registeredUser ? 'active' : 'invited',
      joinedAt: new Date()
    });

    await group.save();

    if (registeredUser) {
      await Notification.create({
        userId: registeredUser._id,
        type: NOTIFICATION_TYPES.GROUP_INVITE,
        title: 'Group Invitation',
        message: `${req.user.name} added you to group "${group.name}".`,
        data: { groupId: group._id, groupName: group.name }
      });
    }

    emitGroupUpdate(req, group._id, 'member_joined', { group });

    res.json({
      success: true,
      message: 'Member invited successfully.',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a shared expense to group
// @route   POST /api/groups/:id/expenses
// @access  Private
const addSharedExpense = async (req, res, next) => {
  try {
    const { title, amount, currency, category, paidBy, splitType = 'equal', splits, date, notes } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const processedSplits = computeExpenseSplits(roundNumber(amount), splitType, splits);

    const expense = await SharedExpense.create({
      groupId: group._id,
      title,
      amount: roundNumber(amount),
      currency: currency || group.currency || 'INR',
      category: category || 'Other',
      paidBy,
      splitType,
      splits: processedSplits,
      date: date || new Date(),
      notes: notes || '',
      createdBy: req.user._id
    });

    // Notify other members
    const payerName = group.members.find(m => String(m.userId) === String(paidBy))?.name || req.user.name;
    for (const split of processedSplits) {
      if (String(split.userId) !== String(req.user._id)) {
        await Notification.create({
          userId: split.userId,
          type: NOTIFICATION_TYPES.GROUP_EXPENSE,
          title: `New Expense in ${group.name}`,
          message: `${payerName} added "${title}" for ${roundNumber(amount)}. Your share is ${split.amount}.`,
          data: { groupId: group._id, expenseId: expense._id }
        });
      }
    }

    emitGroupUpdate(req, group._id, 'expense_added', { expense });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group balances and simplified debt settlement
// @route   GET /api/groups/:id/balances
// @access  Private
const getGroupBalances = async (req, res, next) => {
  try {
    const balanceData = await calculateGroupBalances(req.params.id);
    res.json({
      success: true,
      data: balanceData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a settlement between members
// @route   POST /api/groups/:id/settlements
// @access  Private
const recordSettlement = async (req, res, next) => {
  try {
    const { payerId, payeeId, amount, currency, paymentMethod = 'UPI', notes = '' } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const settlement = await Settlement.create({
      groupId: group._id,
      payerId,
      payeeId,
      amount: roundNumber(amount),
      currency: currency || group.currency || 'INR',
      paymentMethod,
      notes,
      status: 'settled',
      settledAt: new Date()
    });

    // Notify payee
    await Notification.create({
      userId: payeeId,
      type: NOTIFICATION_TYPES.SETTLEMENT,
      title: 'Payment Received',
      message: `${req.user.name} recorded a settlement of ${roundNumber(amount)} in group "${group.name}".`,
      data: { groupId: group._id, settlementId: settlement._id }
    });

    emitGroupUpdate(req, group._id, 'settlement_recorded', { settlement });

    res.status(201).json({
      success: true,
      message: 'Settlement recorded successfully.',
      data: settlement
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  createGroup,
  getGroupById,
  inviteMember,
  addSharedExpense,
  getGroupBalances,
  recordSettlement
};
