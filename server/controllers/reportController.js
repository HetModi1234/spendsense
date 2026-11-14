const { getReportData, generateTransactionsCSV, generatePDFReport } = require('../services/reportService');
const { getCurrentMonthStr, getMonthDateRange } = require('../utils/dateUtils');

// @desc    Get weekly financial report
// @route   GET /api/reports/weekly
// @access  Private
const getWeeklyReport = async (req, res, next) => {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const report = await getReportData(
      req.user._id,
      start,
      end,
      req.user.currency || 'INR'
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly financial report
// @route   GET /api/reports/monthly
// @access  Private
const getMonthlyReport = async (req, res, next) => {
  try {
    const month = req.query.month || getCurrentMonthStr();
    const { startDate, endDate } = getMonthDateRange(month);

    const report = await getReportData(
      req.user._id,
      startDate,
      endDate,
      req.user.currency || 'INR'
    );

    res.json({
      success: true,
      month,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get annual financial report
// @route   GET /api/reports/annual
// @access  Private
const getAnnualReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const report = await getReportData(
      req.user._id,
      startDate,
      endDate,
      req.user.currency || 'INR'
    );

    res.json({
      success: true,
      year,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export transactions as CSV
// @route   GET /api/reports/export/csv
// @access  Private
const exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, month } = req.query;

    let start;
    let end;

    if (month) {
      const range = getMonthDateRange(month);
      start = range.startDate;
      end = range.endDate;
    } else {
      start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : new Date();
    }

    const report = await getReportData(req.user._id, start, end, req.user.currency || 'INR');
    const csvContent = generateTransactionsCSV(report.transactions);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=SpendSense_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export report as downloadable PDF
// @route   GET /api/reports/export/pdf
// @access  Private
const exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, month } = req.query;

    let start;
    let end;

    if (month) {
      const range = getMonthDateRange(month);
      start = range.startDate;
      end = range.endDate;
    } else {
      start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate) : new Date();
    }

    const report = await getReportData(req.user._id, start, end, req.user.currency || 'INR');
    const pdfBuffer = await generatePDFReport(report, req.user.name);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SpendSense_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyReport,
  getMonthlyReport,
  getAnnualReport,
  exportCSV,
  exportPDF
};
