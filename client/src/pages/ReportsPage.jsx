import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Calendar,
  FileText,
  TrendingUp,
  Receipt,
  Store,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ReportsPage() {
  const { format, symbol } = useCurrency();
  const [reportType, setReportType] = useState('monthly'); // 'weekly', 'monthly', 'annual'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/monthly';
      if (reportType === 'weekly') {
        endpoint = '/reports/weekly';
      } else if (reportType === 'monthly') {
        endpoint = `/reports/monthly?month=${selectedMonth}`;
      } else if (reportType === 'annual') {
        endpoint = `/reports/annual?year=${selectedYear}`;
      }

      const res = await api.get(endpoint);
      setReportData(res.data.data);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedMonth, selectedYear]);

  const handleDownloadPDF = async () => {
    setExportingPDF(true);
    try {
      const res = await api.get(`/reports/export/pdf?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SpendSense_Report_${selectedMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF report');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await api.get(`/reports/export/csv?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SpendSense_Transactions_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV Export downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="space-y-6">
        <SkeletonLoader count={1} />
        <SkeletonLoader type="table" count={5} />
      </div>
    );
  }

  const { metrics, categoryBreakdown = [], topMerchants = [], period } = reportData || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports & Exports</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Download professional audit-ready PDF reports and CSV transaction spreadsheets
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            disabled={exportingCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141E30] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-[#1E293B] transition"
          >
            {exportingCSV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={exportingPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition disabled:opacity-50"
          >
            {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="card-glass p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-[#090D18] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setReportType('weekly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              reportType === 'weekly' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly (Last 7 Days)
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              reportType === 'monthly' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setReportType('annual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              reportType === 'annual' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Annual
          </button>
        </div>

        {reportType === 'monthly' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
            />
          </div>
        )}

        {reportType === 'annual' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Select Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
            >
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary KPI Boxes */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-glass p-5 rounded-2xl">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">Total Income</div>
            <div className="text-2xl font-extrabold text-green-400">{format(metrics.totalIncome)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Inflows in period</div>
          </div>

          <div className="card-glass p-5 rounded-2xl">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">Total Expenses</div>
            <div className="text-2xl font-extrabold text-red-400">{format(metrics.totalExpense)}</div>
            <div className="text-[11px] text-slate-500 mt-1">{metrics.transactionCount} total records</div>
          </div>

          <div className="card-glass p-5 rounded-2xl">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">Net Savings</div>
            <div className="text-2xl font-extrabold text-purple-300">{format(metrics.netSavings)}</div>
            <div className="text-[11px] text-slate-500 mt-1">Income minus expenses</div>
          </div>

          <div className="card-glass p-5 rounded-2xl">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">Savings Rate</div>
            <div className="text-2xl font-extrabold text-indigo-400">{metrics.savingsRate}%</div>
            <div className="text-[11px] text-slate-500 mt-1">Target ≥ 20%</div>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glass p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1">Category Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Total expenditures sorted by category volume</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">% of Expenses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoryBreakdown.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{c.category}</td>
                    <td className="py-2.5 px-3 text-slate-200">{format(c.amount)}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-purple-300">{c.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Merchants Table */}
        <div className="card-glass p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1">Top Expense Vendors</h3>
          <p className="text-xs text-slate-400 mb-4">Highest cumulative merchant payees</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Merchant</th>
                  <th className="py-2.5 px-3">Total Spent</th>
                  <th className="py-2.5 px-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topMerchants.length > 0 ? (
                  topMerchants.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-white">{m.merchant}</td>
                      <td className="py-2.5 px-3 text-slate-200">{format(m.amount)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-400">{m.percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-500">
                      No merchant names recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
