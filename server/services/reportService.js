const PDFDocument = require('pdfkit');
const Papa = require('papaparse');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { roundNumber, formatCurrency } = require('../utils/currencyUtils');
const { getMonthDateRange, getCurrentMonthStr } = require('../utils/dateUtils');

/**
 * Calculates report data for a specific date range (weekly, monthly, annual, custom).
 */
const getReportData = async (userId, startDate, endDate, currency = 'INR') => {
  const transactions = await Transaction.find({
    userId,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  })
    .sort({ date: -1 })
    .lean();

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = {};
  const merchantMap = {};
  const paymentMethodMap = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      if (t.merchant) {
        merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + t.amount;
      }
      paymentMethodMap[t.paymentMethod] = (paymentMethodMap[t.paymentMethod] || 0) + t.amount;
    }
  });

  totalIncome = roundNumber(totalIncome);
  totalExpense = roundNumber(totalExpense);
  const netSavings = roundNumber(totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? roundNumber((netSavings / totalIncome) * 100, 1) : 0;

  const categoryBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount: roundNumber(amount),
    percentage: totalExpense > 0 ? roundNumber((amount / totalExpense) * 100, 1) : 0
  })).sort((a, b) => b.amount - a.amount);

  const topMerchants = Object.entries(merchantMap).map(([merchant, amount]) => ({
    merchant,
    amount: roundNumber(amount),
    percentage: totalExpense > 0 ? roundNumber((amount / totalExpense) * 100, 1) : 0
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    period: {
      startDate: new Date(startDate).toISOString().split('T')[0],
      endDate: new Date(endDate).toISOString().split('T')[0]
    },
    currency,
    metrics: {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      transactionCount: transactions.length
    },
    categoryBreakdown,
    topMerchants,
    paymentMethods: Object.entries(paymentMethodMap).map(([method, amount]) => ({
      method,
      amount: roundNumber(amount)
    })),
    transactions
  };
};

/**
 * Generates CSV string of transactions.
 */
const generateTransactionsCSV = (transactions) => {
  const data = transactions.map(t => ({
    Date: new Date(t.date).toISOString().split('T')[0],
    Type: t.type,
    Category: t.category,
    Merchant: t.merchant || '',
    Description: t.description,
    Amount: t.amount,
    Currency: t.currency || 'INR',
    PaymentMethod: t.paymentMethod,
    Notes: t.notes || ''
  }));

  return Papa.unparse(data);
};

/**
 * Generates professional PDF report with SpendSense branding, tables and metrics.
 */
const generatePDFReport = async (reportData, userName = 'Valued User') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const { period, currency, metrics, categoryBreakdown, topMerchants } = reportData;

      // Header Branding
      doc.rect(0, 0, doc.page.width, 100).fill('#090D18');

      doc.fillColor('#8B5CF6').fontSize(24).font('Helvetica-Bold')
        .text('SpendSense AI', 40, 30);
      doc.fillColor('#94A3B8').fontSize(11).font('Helvetica')
        .text('Smart Personal Finance & Expense Intelligence Platform', 40, 60);

      doc.fillColor('#F8FAFC').fontSize(10).font('Helvetica')
        .text(`Generated for: ${userName}`, doc.page.width - 240, 32, { align: 'right' })
        .text(`Period: ${period.startDate} to ${period.endDate}`, doc.page.width - 240, 48, { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString()}`, doc.page.width - 240, 64, { align: 'right' });

      doc.moveDown(4);

      // Section: Executive Financial Summary
      doc.fillColor('#1E293B').fontSize(16).font('Helvetica-Bold')
        .text('Executive Summary', 40, 120);

      // 4 Metric Boxes
      const boxY = 145;
      const boxWidth = 120;
      const boxHeight = 65;
      const gap = 12;

      // Income
      doc.rect(40, boxY, boxWidth, boxHeight).fillAndStroke('#F0FDF4', '#86EFAC');
      doc.fillColor('#166534').fontSize(10).font('Helvetica').text('TOTAL INCOME', 50, boxY + 12);
      doc.fillColor('#15803D').fontSize(14).font('Helvetica-Bold').text(formatCurrency(metrics.totalIncome, currency), 50, boxY + 32);

      // Expense
      doc.rect(40 + boxWidth + gap, boxY, boxWidth, boxHeight).fillAndStroke('#FEF2F2', '#FCA5A5');
      doc.fillColor('#991B1B').fontSize(10).font('Helvetica').text('TOTAL EXPENSE', 50 + boxWidth + gap, boxY + 12);
      doc.fillColor('#B91C1C').fontSize(14).font('Helvetica-Bold').text(formatCurrency(metrics.totalExpense, currency), 50 + boxWidth + gap, boxY + 32);

      // Net Savings
      doc.rect(40 + (boxWidth + gap) * 2, boxY, boxWidth, boxHeight).fillAndStroke('#EEF2FF', '#A5B4FC');
      doc.fillColor('#3730A3').fontSize(10).font('Helvetica').text('NET SAVINGS', 50 + (boxWidth + gap) * 2, boxY + 12);
      doc.fillColor('#4338CA').fontSize(14).font('Helvetica-Bold').text(formatCurrency(metrics.netSavings, currency), 50 + (boxWidth + gap) * 2, boxY + 32);

      // Savings Rate
      doc.rect(40 + (boxWidth + gap) * 3, boxY, boxWidth, boxHeight).fillAndStroke('#FAF5FF', '#D8B4FE');
      doc.fillColor('#6B21A8').fontSize(10).font('Helvetica').text('SAVINGS RATE', 50 + (boxWidth + gap) * 3, boxY + 12);
      doc.fillColor('#7E22CE').fontSize(14).font('Helvetica-Bold').text(`${metrics.savingsRate}%`, 50 + (boxWidth + gap) * 3, boxY + 32);

      // Section: Category Breakdown Table
      let currentY = 235;
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold')
        .text('Expense Breakdown by Category', 40, currentY);

      currentY += 25;
      doc.rect(40, currentY, 515, 24).fill('#F1F5F9');
      doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
      doc.text('Category', 50, currentY + 7);
      doc.text('Amount', 280, currentY + 7);
      doc.text('% of Expenses', 430, currentY + 7);

      currentY += 24;
      doc.font('Helvetica').fontSize(10);

      categoryBreakdown.slice(0, 8).forEach((cat, idx) => {
        const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, currentY, 515, 20).fill(rowBg);
        doc.fillColor('#1E293B');
        doc.text(cat.category, 50, currentY + 5);
        doc.text(formatCurrency(cat.amount, currency), 280, currentY + 5);
        doc.text(`${cat.percentage}%`, 430, currentY + 5);
        currentY += 20;
      });

      // Section: Top Merchants
      if (topMerchants.length > 0) {
        currentY += 20;
        doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold')
          .text('Top Expense Merchants', 40, currentY);

        currentY += 25;
        doc.rect(40, currentY, 515, 24).fill('#F1F5F9');
        doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold');
        doc.text('Merchant', 50, currentY + 7);
        doc.text('Total Spent', 280, currentY + 7);
        doc.text('Share', 430, currentY + 7);

        currentY += 24;
        doc.font('Helvetica').fontSize(10);

        topMerchants.forEach((m, idx) => {
          const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
          doc.rect(40, currentY, 515, 20).fill(rowBg);
          doc.fillColor('#1E293B');
          doc.text(m.merchant, 50, currentY + 5);
          doc.text(formatCurrency(m.amount, currency), 280, currentY + 5);
          doc.text(`${m.percentage}%`, 430, currentY + 5);
          currentY += 20;
        });
      }

      // AI Summary Note
      currentY += 25;
      doc.rect(40, currentY, 515, 60).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#6366F1').fontSize(10).font('Helvetica-Bold')
        .text('SpendSense AI Executive Note:', 50, currentY + 10);
      doc.fillColor('#475569').fontSize(9).font('Helvetica')
        .text(
          `During this period, you logged ${metrics.transactionCount} transactions. ` +
          `Your net savings of ${formatCurrency(metrics.netSavings, currency)} reflects a savings rate of ${metrics.savingsRate}%. ` +
          `Your highest spending went towards ${categoryBreakdown[0]?.category || 'discretionary purchases'} ` +
          `(${categoryBreakdown[0]?.percentage || 0}% of all expenses).`,
          50, currentY + 26, { width: 495 }
        );

      // Footer
      doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
        .text('Confidential Personal Financial Report • Powered by SpendSense AI', 40, doc.page.height - 35, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  getReportData,
  generateTransactionsCSV,
  generatePDFReport
};
