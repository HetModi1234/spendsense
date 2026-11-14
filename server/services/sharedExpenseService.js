const SharedExpense = require('../models/SharedExpense');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const { roundNumber } = require('../utils/currencyUtils');

/**
 * Calculates member balances and simplified debt settlement graph for a group.
 * Deterministic JavaScript algorithm.
 */
const calculateGroupBalances = async (groupId) => {
  const [group, expenses, settlements] = await Promise.all([
    Group.findById(groupId).lean(),
    SharedExpense.find({ groupId }).lean(),
    Settlement.find({ groupId, status: 'settled' }).lean()
  ]);

  if (!group) {
    throw new Error('Group not found');
  }

  // Net balance map for each member: userId -> netBalance
  // positive: is owed money (+), negative: owes money (-)
  const balances = {};
  const memberInfo = {};

  group.members.forEach(m => {
    const idStr = String(m.userId || m._id);
    balances[idStr] = 0;
    memberInfo[idStr] = {
      id: idStr,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      role: m.role
    };
  });

  let totalExpensesSum = 0;

  // Process all shared expenses
  expenses.forEach(exp => {
    totalExpensesSum += exp.amount;
    const payerId = String(exp.paidBy);

    // Payer is credited the full amount
    if (balances[payerId] !== undefined) {
      balances[payerId] += exp.amount;
    } else {
      balances[payerId] = exp.amount;
    }

    // Each participant in the split is debited their share
    exp.splits.forEach(split => {
      const participantId = String(split.userId);
      if (balances[participantId] !== undefined) {
        balances[participantId] -= split.amount;
      } else {
        balances[participantId] = -split.amount;
      }
    });
  });

  // Process settlements: payer pays payee, so payer's balance increases towards 0, payee decreases
  settlements.forEach(settlement => {
    const payerId = String(settlement.payerId);
    const payeeId = String(settlement.payeeId);

    if (balances[payerId] !== undefined) balances[payerId] += settlement.amount;
    if (balances[payeeId] !== undefined) balances[payeeId] -= settlement.amount;
  });

  // Round all balances
  Object.keys(balances).forEach(id => {
    balances[id] = roundNumber(balances[id]);
  });

  // Simplified Debt Settlement Algorithm (Minimizes transactions)
  // Split members into debtors (owes < 0) and creditors (is owed > 0)
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([id, net]) => {
    if (net < -0.01) {
      debtors.push({ id, amount: Math.abs(net) });
    } else if (net > 0.01) {
      creditors.push({ id, amount: net });
    }
  });

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const suggestedSettlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = roundNumber(Math.min(debtor.amount, creditor.amount));

    if (settleAmount > 0.01) {
      suggestedSettlements.push({
        from: debtor.id,
        fromName: memberInfo[debtor.id]?.name || 'Unknown',
        to: creditor.id,
        toName: memberInfo[creditor.id]?.name || 'Unknown',
        amount: settleAmount
      });
    }

    debtor.amount = roundNumber(debtor.amount - settleAmount);
    creditor.amount = roundNumber(creditor.amount - settleAmount);

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  // Format member balances list
  const memberBalances = Object.entries(balances).map(([id, net]) => ({
    member: memberInfo[id] || { id, name: 'Unknown' },
    netBalance: net,
    status: net > 0 ? 'owed' : net < 0 ? 'owes' : 'settled'
  }));

  return {
    group: {
      id: group._id,
      name: group.name,
      currency: group.currency,
      memberCount: group.members.length
    },
    totalExpenses: roundNumber(totalExpensesSum),
    expenseCount: expenses.length,
    memberBalances,
    suggestedSettlements
  };
};

/**
 * Validates and calculates split shares for an expense based on splitType.
 */
const computeExpenseSplits = (totalAmount, splitType, rawSplits) => {
  const numSplits = rawSplits.length;
  if (numSplits === 0) throw new Error('At least one member must be included in split');

  let processedSplits = [];

  if (splitType === 'equal') {
    const baseShare = Math.floor((totalAmount / numSplits) * 100) / 100;
    let remainder = roundNumber(totalAmount - (baseShare * numSplits));

    processedSplits = rawSplits.map((s, idx) => {
      let amount = baseShare;
      if (remainder > 0 && idx === 0) {
        amount = roundNumber(amount + remainder);
      }
      return {
        userId: s.userId,
        amount: roundNumber(amount),
        percentage: roundNumber((amount / totalAmount) * 100, 2)
      };
    });
  } else if (splitType === 'percentage') {
    const totalPercent = rawSplits.reduce((acc, s) => acc + Number(s.percentage || 0), 0);
    if (Math.abs(totalPercent - 100) > 0.1) {
      throw new Error(`Total split percentage must equal 100%. Currently equals ${totalPercent}%`);
    }

    processedSplits = rawSplits.map(s => {
      const amount = roundNumber((totalAmount * Number(s.percentage)) / 100);
      return {
        userId: s.userId,
        amount,
        percentage: Number(s.percentage)
      };
    });
  } else if (splitType === 'exact') {
    const sumAmounts = rawSplits.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    if (Math.abs(sumAmounts - totalAmount) > 0.01) {
      throw new Error(`Total split sum (${sumAmounts}) must match expense amount (${totalAmount})`);
    }

    processedSplits = rawSplits.map(s => ({
      userId: s.userId,
      amount: Number(s.amount),
      percentage: roundNumber((Number(s.amount) / totalAmount) * 100, 2)
    }));
  }

  return processedSplits;
};

module.exports = {
  calculateGroupBalances,
  computeExpenseSplits
};
