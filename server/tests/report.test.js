const { generateTransactionsCSV, generatePDFReport } = require('../services/reportService');

describe('Reports & Export Services', () => {
  const sampleTransactions = [
    {
      date: new Date('2026-11-01'),
      type: 'income',
      category: 'Salary',
      merchant: 'Tech Corp',
      description: 'Monthly Pay',
      amount: 80000,
      currency: 'INR',
      paymentMethod: 'Bank Transfer'
    },
    {
      date: new Date('2026-11-05'),
      type: 'expense',
      category: 'Food',
      merchant: 'Swiggy',
      description: 'Lunch Bowl',
      amount: 350,
      currency: 'INR',
      paymentMethod: 'UPI'
    }
  ];

  it('should generate valid CSV text formatted with headers', () => {
    const csv = generateTransactionsCSV(sampleTransactions);
    expect(csv).toContain('Date,Type,Category,Merchant,Description,Amount,Currency,PaymentMethod,Notes');
    expect(csv).toContain('Salary');
    expect(csv).toContain('80000');
    expect(csv).toContain('Swiggy');
  });

  it('should generate a valid PDF buffer with SpendSense branding and tables', async () => {
    const reportData = {
      period: { startDate: '2026-11-01', endDate: '2026-11-30' },
      currency: 'INR',
      metrics: {
        totalIncome: 80000,
        totalExpense: 350,
        netSavings: 79650,
        savingsRate: 99.6,
        transactionCount: 2
      },
      categoryBreakdown: [
        { category: 'Food', amount: 350, percentage: 100 }
      ],
      topMerchants: [
        { merchant: 'Swiggy', amount: 350, percentage: 100 }
      ],
      transactions: sampleTransactions
    };

    const pdfBuffer = await generatePDFReport(reportData, 'Het Modi');
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes
    expect(pdfBuffer.slice(0, 4).toString()).toBe('%PDF');
  });
});
