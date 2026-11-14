const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const { detectDuplicate, findUserDuplicates } = require('../services/duplicateDetectionService');
const { NOTIFICATION_TYPES, BUDGET_THRESHOLDS } = require('../config/constants');
const { getCurrentMonthStr, getMonthDateRange } = require('../utils/dateUtils');
const { roundNumber } = require('../utils/currencyUtils');

// Helper to check budget threshold after adding/modifying expense
const checkBudgetThresholds = async (userId, date = new Date()) => {
  try {
    const month = new Date(date).toISOString().slice(0, 7);
    const budget = await Budget.findOne({ userId, month });
    if (!budget || !budget.totalBudget || budget.totalBudget <= 0) return;

    const range = getMonthDateRange(month);
    const expenses = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: range.startDate, $lte: range.endDate }
    }).lean();

    const totalSpent = expenses.reduce((acc, t) => acc + t.amount, 0);
    const utilization = (totalSpent / budget.totalBudget) * 100;

    let alertType = null;
    let thresholdValue = 0;

    if (utilization >= BUDGET_THRESHOLDS.EXCEEDED) {
      alertType = NOTIFICATION_TYPES.BUDGET_EXCEEDED;
      thresholdValue = 100;
    } else if (utilization >= BUDGET_THRESHOLDS.CRITICAL) {
      alertType = NOTIFICATION_TYPES.BUDGET_THRESHOLD;
      thresholdValue = 90;
    } else if (utilization >= BUDGET_THRESHOLDS.WARNING) {
      alertType = NOTIFICATION_TYPES.BUDGET_THRESHOLD;
      thresholdValue = 75;
    }

    if (alertType) {
      // Check if alert already sent for this month and threshold
      const alreadyAlerted = budget.alertsTriggered.some(
        a => a.threshold === thresholdValue && a.category === 'Total'
      );

      if (!alreadyAlerted) {
        budget.alertsTriggered.push({
          type: alertType,
          category: 'Total',
          percentage: roundNumber(utilization, 1),
          triggeredAt: new Date()
        });
        await budget.save();

        await Notification.create({
          userId,
          type: alertType,
          title: thresholdValue >= 100 ? 'Budget Exceeded!' : `Budget Alert: ${thresholdValue}% Reached`,
          message: `You have spent ${roundNumber(utilization, 1)}% of your monthly budget for ${month} (${totalSpent} / ${budget.totalBudget}).`,
          data: { month, totalSpent, totalBudget: budget.totalBudget, percentage: utilization }
        });
      }
    }
  } catch (err) {
    console.error('[Budget Alert Check Error]:', err.message);
  }
};

// @desc    Get user transactions with search, filter, pagination, sorting
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      duplicateStatus
    } = req.query;

    const query = { userId: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (duplicateStatus) query.duplicateStatus = duplicateStatus;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { merchant: searchRegex },
        { notes: searchRegex },
        { category: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      currency = req.user.currency || 'INR',
      category,
      merchant,
      description,
      date,
      paymentMethod,
      notes,
      isRecurring,
      recurringFrequency,
      tags
    } = req.body;

    // Check for duplicate
    const duplicateCheck = await detectDuplicate({
      userId: req.user._id,
      amount,
      merchant,
      description,
      date: date || new Date()
    });

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: roundNumber(amount),
      currency,
      category,
      merchant: merchant || '',
      description,
      date: date || new Date(),
      paymentMethod: paymentMethod || 'Other',
      notes: notes || '',
      isRecurring: Boolean(isRecurring),
      recurringFrequency: recurringFrequency || 'none',
      tags: tags || [],
      duplicateStatus: duplicateCheck.isDuplicate ? 'potential' : 'none',
      potentialDuplicateOf: duplicateCheck.isDuplicate ? duplicateCheck.matchedTransaction._id : null
    });

    // If duplicate detected, generate notification
    if (duplicateCheck.isDuplicate) {
      await Notification.create({
        userId: req.user._id,
        type: NOTIFICATION_TYPES.DUPLICATE_TRANSACTION,
        title: 'Possible Duplicate Transaction Detected',
        message: duplicateCheck.reason,
        data: {
          transactionId: transaction._id,
          matchedTransactionId: duplicateCheck.matchedTransaction._id,
          confidence: duplicateCheck.confidence
        }
      });
    }

    // Check budget thresholds if expense
    if (type === 'expense') {
      checkBudgetThresholds(req.user._id, transaction.date);
    }

    res.status(201).json({
      success: true,
      data: transaction,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck.reason : null
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized.'
      });
    }

    const fields = [
      'type',
      'amount',
      'currency',
      'category',
      'merchant',
      'description',
      'date',
      'paymentMethod',
      'notes',
      'isRecurring',
      'recurringFrequency',
      'tags',
      'duplicateStatus'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        transaction[field] = req.body[field];
      }
    });

    await transaction.save();

    if (transaction.type === 'expense') {
      checkBudgetThresholds(req.user._id, transaction.date);
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or unauthorized.'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detected duplicates for review
// @route   GET /api/transactions/duplicates
// @access  Private
const getDuplicates = async (req, res, next) => {
  try {
    const duplicates = await findUserDuplicates(req.user._id);
    res.json({
      success: true,
      count: duplicates.length,
      data: duplicates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and update duplicate status
// @route   PATCH /api/transactions/:id/duplicate-status
// @access  Private
const reviewDuplicate = async (req, res, next) => {
  try {
    const { status } = req.body; // 'reviewed' or 'none'
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { duplicateStatus: status || 'reviewed' },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import transactions from CSV (preview and save)
// @route   POST /api/transactions/import
// @access  Private
const importTransactions = async (req, res, next) => {
  try {
    const { transactions, previewOnly = false } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transactions provided for import.'
      });
    }

    const validRows = [];
    const invalidRows = [];
    const potentialDuplicates = [];

    for (let i = 0; i < transactions.length; i++) {
      const row = transactions[i];
      const amount = parseFloat(String(row.amount || '').replace(/[^0-9.-]+/g, ''));

      if (isNaN(amount) || amount <= 0 || !row.description) {
        invalidRows.push({
          row: i + 1,
          data: row,
          reason: 'Invalid amount or missing description'
        });
        continue;
      }

      const rowDate = row.date ? new Date(row.date) : new Date();
      const validDate = !isNaN(rowDate.getTime()) ? rowDate : new Date();

      const normalized = {
        userId: req.user._id,
        type: row.type === 'income' ? 'income' : 'expense',
        amount: roundNumber(amount),
        currency: row.currency || req.user.currency || 'INR',
        category: row.category || (row.type === 'income' ? 'Other income' : 'Other'),
        merchant: row.merchant || '',
        description: row.description,
        date: validDate,
        paymentMethod: row.paymentMethod || 'Other',
        notes: row.notes || 'Imported via CSV'
      };

      // Check duplicates
      const dup = await detectDuplicate({
        userId: req.user._id,
        amount: normalized.amount,
        merchant: normalized.merchant,
        description: normalized.description,
        date: normalized.date
      });

      if (dup.isDuplicate) {
        normalized.duplicateStatus = 'potential';
        potentialDuplicates.push({
          row: i + 1,
          imported: normalized,
          existing: dup.matchedTransaction,
          reason: dup.reason
        });
      }

      validRows.push(normalized);
    }

    if (previewOnly) {
      return res.json({
        success: true,
        summary: {
          totalRows: transactions.length,
          validCount: validRows.length,
          invalidCount: invalidRows.length,
          potentialDuplicatesCount: potentialDuplicates.length
        },
        preview: validRows.slice(0, 10),
        invalidRows,
        potentialDuplicates
      });
    }

    // Save transactions
    const inserted = await Transaction.insertMany(validRows);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} transactions.`,
      count: inserted.length,
      potentialDuplicatesCount: potentialDuplicates.length,
      invalidCount: invalidRows.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getDuplicates,
  reviewDuplicate,
  importTransactions
};
