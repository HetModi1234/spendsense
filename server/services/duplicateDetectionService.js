const Transaction = require('../models/Transaction');
const { calculateSimilarity } = require('../utils/helpers');

/**
 * Checks if a transaction is a duplicate of any existing transactions for the same user.
 * Deterministic JavaScript algorithm.
 *
 * @param {Object} candidate - { userId, amount, merchant, description, date, excludeId }
 * @returns {Promise<{ isDuplicate: boolean, confidence: 'exact'|'probable'|'none', matchedTransaction: Object|null, reason: string }>}
 */
const detectDuplicate = async (candidate) => {
  const { userId, amount, merchant = '', description = '', date, excludeId = null } = candidate;

  const candidateDate = new Date(date || Date.now());
  // Check within +/- 3 days
  const minDate = new Date(candidateDate.getTime() - 3 * 24 * 60 * 60 * 1000);
  const maxDate = new Date(candidateDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  const query = {
    userId,
    amount: Number(amount),
    date: { $gte: minDate, $lte: maxDate }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const matches = await Transaction.find(query).lean();

  if (!matches || matches.length === 0) {
    return {
      isDuplicate: false,
      confidence: 'none',
      matchedTransaction: null,
      reason: ''
    };
  }

  for (const match of matches) {
    const merchantSim = calculateSimilarity(merchant, match.merchant || '');
    const descSim = calculateSimilarity(description, match.description || '');
    const dateDiffHours = Math.abs(new Date(match.date).getTime() - candidateDate.getTime()) / (1000 * 60 * 60);

    // Exact duplicate condition: same amount, date within 24 hours, very high text similarity
    if (dateDiffHours <= 24 && (merchantSim >= 0.8 || descSim >= 0.8)) {
      return {
        isDuplicate: true,
        confidence: 'exact',
        matchedTransaction: match,
        reason: `Exact match detected: ${match.description || match.merchant} for the same amount on ${new Date(match.date).toLocaleDateString()}.`
      };
    }

    // Probable duplicate condition: same amount within 3 days, moderate text similarity
    if (merchantSim >= 0.6 || descSim >= 0.6) {
      return {
        isDuplicate: true,
        confidence: 'probable',
        matchedTransaction: match,
        reason: `Probable duplicate: Similar transaction "${match.description || match.merchant}" on ${new Date(match.date).toLocaleDateString()} for the same amount.`
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: 'none',
    matchedTransaction: null,
    reason: ''
  };
};

/**
 * Scans an entire list of transactions or database for duplicate pairs.
 */
const findUserDuplicates = async (userId) => {
  const transactions = await Transaction.find({ userId })
    .sort({ date: -1 })
    .lean();

  const duplicates = [];
  const visited = new Set();

  for (let i = 0; i < transactions.length; i++) {
    const t1 = transactions[i];
    if (visited.has(String(t1._id))) continue;

    for (let j = i + 1; j < transactions.length; j++) {
      const t2 = transactions[j];
      if (visited.has(String(t2._id))) continue;

      // Same amount check
      if (Math.abs(t1.amount - t2.amount) < 0.01) {
        const dateDiffHours = Math.abs(new Date(t1.date).getTime() - new Date(t2.date).getTime()) / (1000 * 60 * 60);

        if (dateDiffHours <= 72) {
          const merchantSim = calculateSimilarity(t1.merchant, t2.merchant);
          const descSim = calculateSimilarity(t1.description, t2.description);

          if (dateDiffHours <= 24 && (merchantSim >= 0.8 || descSim >= 0.8)) {
            duplicates.push({
              confidence: 'exact',
              transactionA: t1,
              transactionB: t2,
              reason: 'Identical amount and merchant/description within 24 hours'
            });
            visited.add(String(t2._id));
            break;
          } else if (merchantSim >= 0.6 || descSim >= 0.6) {
            duplicates.push({
              confidence: 'probable',
              transactionA: t1,
              transactionB: t2,
              reason: 'Identical amount with similar merchant/description within 3 days'
            });
            visited.add(String(t2._id));
            break;
          }
        }
      }
    }
  }

  return duplicates;
};

module.exports = {
  detectDuplicate,
  findUserDuplicates
};
