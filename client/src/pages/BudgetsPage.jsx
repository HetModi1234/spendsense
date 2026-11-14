import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Sparkles,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Save,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import SkeletonLoader from '../components/SkeletonLoader';

const DEFAULT_CATEGORIES = [
  'Food', 'Shopping', 'Transportation', 'Housing', 'Bills',
  'Healthcare', 'Education', 'Entertainment', 'Travel', 'Subscriptions',
  'Personal care', 'Other'
];

export default function BudgetsPage() {
  const { format, symbol } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState(null);
  const [totalBudgetInput, setTotalBudgetInput] = useState(50000);
  const [categoryLimits, setCategoryLimits] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?month=${selectedMonth}`);
      const data = res.data.data;
      setBudgetData(data);
      setTotalBudgetInput(data.totalBudget || 50000);

      // Pre-fill categories from existing or defaults
      if (data.categoryBudgets && data.categoryBudgets.length > 0) {
        setCategoryLimits(data.categoryBudgets);
      } else {
        setCategoryLimits(DEFAULT_CATEGORIES.slice(0, 6).map(c => ({
          category: c,
          limit: 5000,
          spent: 0,
          utilization: 0,
          remaining: 5000
        })));
      }
    } catch (err) {
      toast.error('Failed to load budget.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await api.get('/budgets/recommendations');
      setRecommendations(res.data.data);
    } catch (err) {
      // Ignore
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchBudget();
    fetchRecommendations();
  }, [selectedMonth]);

  const handleApplyRecommendations = () => {
    if (!recommendations) return;
    setTotalBudgetInput(recommendations.recommendedTotalBudget);
    setCategoryLimits(recommendations.categoryRecommendations.map(r => ({
      category: r.category,
      limit: r.recommendedLimit,
      spent: 0,
      utilization: 0,
      remaining: r.recommendedLimit
    })));
    toast.success('Applied historical budget recommendations! Review and click Save.');
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    try {
      await api.post('/budgets', {
        month: selectedMonth,
        totalBudget: Number(totalBudgetInput),
        categoryBudgets: categoryLimits.map(c => ({
          category: c.category,
          limit: Number(c.limit)
        }))
      });
      toast.success('Budget saved successfully!');
      fetchBudget();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryLimitChange = (index, newLimit) => {
    const updated = [...categoryLimits];
    updated[index].limit = Number(newLimit) || 0;
    setCategoryLimits(updated);
  };

  const handleAddCategoryRow = () => {
    const existing = new Set(categoryLimits.map(c => c.category));
    const nextCat = DEFAULT_CATEGORIES.find(c => !existing.has(c)) || 'Other';
    setCategoryLimits([...categoryLimits, { category: nextCat, limit: 3000, spent: 0, utilization: 0, remaining: 3000 }]);
  };

  const handleRemoveCategoryRow = (index) => {
    const updated = categoryLimits.filter((_, i) => i !== index);
    setCategoryLimits(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Budgets & Limits</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Configure monthly allowances, track category utilization, and get AI recommendations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            onClick={handleSaveBudget}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Budget'}</span>
          </button>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {recommendations && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                <span>AI Historical Recommendation Available</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300">
                  {recommendations.monthCount} Month Average
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {recommendations.aiSummary || `Calculated based on your historical spend with a 10% safety buffer: recommended total is ${format(recommendations.recommendedTotalBudget)}.`}
              </p>
            </div>
          </div>
          <button
            onClick={handleApplyRecommendations}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition active:scale-95"
          >
            <span>Apply AI Targets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overall Utilization Card */}
      {budgetData && (
        <div className="card-glass p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Budget Utilization ({selectedMonth})
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {format(budgetData.totalSpent)} <span className="text-sm text-slate-400 font-normal">of {format(totalBudgetInput)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Remaining Allowance</span>
                <span className="text-lg font-bold text-green-400">
                  {format(Math.max(0, totalBudgetInput - budgetData.totalSpent))}
                </span>
              </div>
              <div
                className={`text-xs font-bold px-3 py-1.5 rounded-xl uppercase border ${
                  budgetData.utilization >= 100
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : budgetData.utilization >= 75
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-green-500/20 text-green-300 border-green-500/30'
                }`}
              >
                {budgetData.status}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#090D18] rounded-full h-3 overflow-hidden border border-slate-800 my-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetData.utilization >= 100
                  ? 'bg-red-500'
                  : budgetData.utilization >= 75
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (budgetData.totalSpent / (totalBudgetInput || 1)) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>0%</span>
            <span>50% (Info)</span>
            <span>75% (Warning)</span>
            <span>90% (Critical)</span>
            <span>100% (Exceeded)</span>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="card-glass p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Category Limits & Progress</h3>
            <p className="text-xs text-slate-400">Set individual category caps to prevent overspending</p>
          </div>
          <button
            onClick={handleAddCategoryRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {categoryLimits.map((cat, idx) => {
            const spent = cat.spent || 0;
            const limit = cat.limit || 1;
            const pct = Math.round((spent / limit) * 100);

            return (
              <div key={idx} className="p-4 rounded-xl bg-[#090D18]/80 border border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <select
                      value={cat.category}
                      onChange={(e) => {
                        const updated = [...categoryLimits];
                        updated[idx].category = e.target.value;
                        setCategoryLimits(updated);
                      }}
                      className="bg-transparent font-bold text-sm text-white outline-none cursor-pointer border-b border-slate-700 pb-0.5"
                    >
                      {DEFAULT_CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-[#101727]">{c}</option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-400">
                      Spent: <strong className="text-white">{format(spent)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Limit: {symbol}</span>
                      <input
                        type="number"
                        value={cat.limit}
                        onChange={(e) => handleCategoryLimitChange(idx, e.target.value)}
                        className="w-24 px-2 py-1 bg-[#101727] border border-slate-700 rounded-lg text-xs font-bold text-white text-right outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCategoryRow(idx)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                      title="Remove category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{pct}% utilized</span>
                  <span className={limit >= spent ? 'text-green-400' : 'text-red-400'}>
                    {limit >= spent ? `${format(limit - spent)} left` : `Over by ${format(spent - limit)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
