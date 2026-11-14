import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Plus,
  Wand2,
  Calendar,
  ChevronRight,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import MetricCard from '../components/MetricCard';
import SkeletonLoader from '../components/SkeletonLoader';
import AIQuickEntryModal from '../components/AIQuickEntryModal';
import AddTransactionModal from '../components/AddTransactionModal';

const PIE_COLORS = [
  '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B',
  '#06B6D4', '#EF4444', '#6366F1', '#D946EF', '#64748B'
];

export default function OverviewPage() {
  const { user } = useAuth();
  const { format, symbol } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, chartRes, txRes] = await Promise.all([
        api.get(`/dashboard/summary?month=${selectedMonth}`),
        api.get(`/dashboard/charts?month=${selectedMonth}`),
        api.get('/dashboard/recent-transactions?limit=6')
      ]);

      setSummaryData(sumRes.data.data);
      setChartData(chartRes.data.data);
      setRecentTransactions(txRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleAdded = () => fetchDashboardData();
    window.addEventListener('spendsense_transaction_added', handleAdded);
    return () => window.removeEventListener('spendsense_transaction_added', handleAdded);
  }, [selectedMonth]);

  if (loading && !summaryData) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="metric" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader count={1} />
          <SkeletonLoader count={1} />
        </div>
      </div>
    );
  }

  const {
    totalBalance = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    monthlySavings = 0,
    savingsRate = 0,
    expenseChangePercent = 0,
    totalBudget = 0,
    budgetUtilization = 0,
    topCategory = null,
    forecast = null
  } = summaryData || {};

  return (
    <div className="space-y-6">
      {/* Top Header / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Hello, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Here is your financial pulse and intelligence overview
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141E30] border border-[#1E293B] text-xs font-medium text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Entry</span>
          </button>

          <button
            onClick={() => setIsAddTxModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Net Balance"
          value={format(totalBalance)}
          subtitle="All accounts net worth"
          icon={Wallet}
          color="purple"
        />

        <MetricCard
          title="Monthly Income"
          value={format(monthlyIncome)}
          subtitle="Total inflows this month"
          icon={ArrowUpRight}
          color="green"
        />

        <MetricCard
          title="Monthly Expenses"
          value={format(monthlyExpenses)}
          subtitle={`${expenseChangePercent >= 0 ? '+' : ''}${expenseChangePercent}% vs last month`}
          trend={`${Math.abs(expenseChangePercent)}%`}
          trendPositive={expenseChangePercent <= 0}
          icon={ArrowDownRight}
          color="red"
        />

        <MetricCard
          title="Net Savings"
          value={format(monthlySavings)}
          subtitle={`${savingsRate}% savings rate`}
          trend={`${savingsRate}%`}
          trendPositive={savingsRate >= 20}
          icon={PiggyBank}
          color="blue"
        />
      </div>

      {/* Row 2: Budget Progress & Spending Forecast Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Utilization Card */}
        <div className="card-glass p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Budget Target ({selectedMonth})
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  budgetUtilization >= 100
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : budgetUtilization >= 75
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                }`}
              >
                {budgetUtilization >= 100 ? 'Exceeded' : budgetUtilization >= 75 ? 'Warning' : 'Healthy'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="text-2xl font-bold text-white">{format(monthlyExpenses)}</div>
              <div className="text-xs text-slate-400">Target: {format(totalBudget)}</div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#090D18] rounded-full h-2.5 overflow-hidden my-3 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilization >= 100
                    ? 'bg-red-500'
                    : budgetUtilization >= 75
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>{budgetUtilization}% spent</span>
              <span>
                {totalBudget > monthlyExpenses
                  ? `${format(totalBudget - monthlyExpenses)} remaining`
                  : `Over by ${format(monthlyExpenses - totalBudget)}`}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              to="/budgets"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Category Budgets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* AI Spending Forecast Card */}
        <div className="card-glass p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-purple-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Month-End Forecast</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Run-rate</span>
            </div>

            {forecast ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    {format(forecast.projectedTotal)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Velocity: {format(forecast.dailyRunRate)}/day
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {forecast.willOverrunBudget ? (
                    <span className="text-amber-300">
                      ⚠️ At current velocity, you are on track to exceed budget by {format(forecast.projectedOverrunAmount)}.
                    </span>
                  ) : (
                    <span className="text-green-300">
                      ✓ Projected to finish under budget with {format(Math.max(0, forecast.totalBudget - forecast.projectedTotal))} surplus.
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">
                No expense data recorded yet for {selectedMonth} to compute velocity projections.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              to="/insights"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <span>View Deep AI Insights</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Top Spending Category / Quick Insight */}
        <div className="card-glass p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Top Spending Category
              </span>
              <Target className="w-4 h-4 text-purple-400" />
            </div>

            {topCategory ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">{topCategory.category}</div>
                <div className="text-xs text-slate-300">
                  Total Spent: <strong className="text-white">{format(topCategory.currentSpent)}</strong>
                </div>
                <div className="text-xs text-purple-300 font-medium">
                  Represents {topCategory.shareOfTotal}% of all your monthly expenditures.
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-4">
                No expenses logged this month yet.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <span>Add Quick Expense</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Income vs Expenses Bar Chart */}
        <div className="card-glass p-5 rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Income vs Expenses (Last 6 Months)</h3>
              <p className="text-xs text-slate-400">Deterministic cash flow comparison</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData?.monthlyTrendData && chartData.monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${symbol}${v >= 1000 ? `${v/1000}k` : v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141E30', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => format(val)}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No trend data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Category Expense Donut Chart */}
        <div className="card-glass p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Category Breakdown</h3>
              <p className="text-xs text-slate-400">Share of {selectedMonth} expenses</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {chartData?.categoryChartData && chartData.categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#141E30', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(val) => format(val)}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500 text-center">
                No expenses logged for this month.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Transactions & Quick Entry Bar */}
      <div className="card-glass p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest income and expense records</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-[#1E293B]">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="py-3 flex items-center justify-between hover:bg-slate-800/20 px-2 rounded-xl transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    }`}
                  >
                    {tx.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{tx.description}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {tx.merchant ? `${tx.merchant} • ` : ''}{tx.category} • {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-green-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase">{tx.paymentMethod}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No transactions found. Use "AI Quick Entry" or "Add Transaction" to log your first expense!
          </div>
        )}
      </div>

      {/* Modals */}
      <AIQuickEntryModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
