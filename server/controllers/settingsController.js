const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const AIConversation = require('../models/AIConversation');
const Notification = require('../models/Notification');
const SharedExpense = require('../models/SharedExpense');
const Group = require('../models/Group');

// @desc    Get all user settings & preferences
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const {
      name,
      avatar,
      currency,
      monthlyIncome,
      monthlyBudget,
      timezone,
      preferences
    } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (currency) user.currency = currency;
    if (monthlyIncome !== undefined) user.monthlyIncome = monthlyIncome;
    if (monthlyBudget !== undefined) user.monthlyBudget = monthlyBudget;
    if (timezone) user.timezone = timezone;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export all personal data as JSON
// @route   GET /api/settings/export-data
// @access  Private
const exportUserData = async (req, res, next) => {
  try {
    const [user, transactions, budgets, conversations, notifications] = await Promise.all([
      User.findById(req.user._id).select('-passwordHash').lean(),
      Transaction.find({ userId: req.user._id }).lean(),
      Budget.find({ userId: req.user._id }).lean(),
      AIConversation.find({ userId: req.user._id }).lean(),
      Notification.find({ userId: req.user._id }).lean()
    ]);

    const exportPayload = {
      exportDate: new Date().toISOString(),
      platform: 'SpendSense AI',
      user,
      transactions,
      budgets,
      conversations,
      notifications
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=SpendSense_UserData_${user._id}.json`);
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete only financial data (transactions, budgets, conversations)
// @route   DELETE /api/settings/financial-data
// @access  Private
const deleteFinancialData = async (req, res, next) => {
  try {
    await Promise.all([
      Transaction.deleteMany({ userId: req.user._id }),
      Budget.deleteMany({ userId: req.user._id }),
      AIConversation.deleteMany({ userId: req.user._id }),
      Notification.deleteMany({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      message: 'All your personal financial data has been wiped clean.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete entire account permanently
// @route   DELETE /api/settings/account
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      Transaction.deleteMany({ userId: req.user._id }),
      Budget.deleteMany({ userId: req.user._id }),
      AIConversation.deleteMany({ userId: req.user._id }),
      Notification.deleteMany({ userId: req.user._id }),
      // Remove from any groups
      Group.updateMany(
        { 'members.userId': req.user._id },
        { $pull: { members: { userId: req.user._id } } }
      )
    ]);

    res.json({
      success: true,
      message: 'Your SpendSense AI account and all associated data have been permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  exportUserData,
  deleteFinancialData,
  deleteAccount
};
