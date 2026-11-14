import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import SkeletonLoader from '../components/SkeletonLoader';

export default function AIInsightsPage() {
  const { format, symbol } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insRes, fcastRes] = await Promise.all([
        api.post('/ai/insights', { month: selectedMonth }),
        api.post('/ai/forecast', { month: selectedMonth })
      ]);

      setInsightsData(insRes.data.data);
      setForecastData(fcastRes.data.data);
    } catch (err) {
      toast.error('Failed to load AI Insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  if (loading && !insightsData) {
    return (
      <div className="space-y-6">
        <SkeletonLoader count={1} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader count={1} />
          <SkeletonLoader count={1} />
        </div>
      </div>
    );
  }

  const { metrics, insights = [], savingSuggestions = [], aiAnalysis = '' } = insightsData || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Financial Insights</h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Verified mathematical analysis interpreted by SpendSense AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141E30] border border-[#1E293B] text-xs font-medium text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* AI Executive Summary Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#101727] to-[#141E30] border border-purple-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-1">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Executive AI Synthesis • {selectedMonth}
            </div>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed font-medium">
              {aiAnalysis || 'Analyzing your finances...'}
            </p>

            {/* Quick Metrics Badges */}
            {metrics && (
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <span className="px-3 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-slate-300">
                  Income: <strong className="text-green-400">{format(metrics.currentIncome)}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-slate-300">
                  Expenses: <strong className="text-red-400">{format(metrics.currentExpense)}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-slate-300">
                  Net Savings: <strong className="text-purple-300">{format(metrics.currentSavings)} ({metrics.savingsRate}%)</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-slate-300">
                  MoM Change: <strong className={metrics.expenseChangeAmount > 0 ? 'text-red-400' : 'text-green-400'}>
                    {metrics.expenseChangeAmount > 0 ? '+' : ''}{format(metrics.expenseChangeAmount)} ({metrics.expenseChangePercent}%)
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Section (Module 7) */}
      {forecastData?.hasData && (
        <div className="card-glass p-6 rounded-2xl border border-indigo-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Month-End Spending Projection</h3>
                <p className="text-[11px] text-slate-400">{forecastData.disclaimer}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {forecastData.progress.elapsedDays} / {forecastData.progress.totalDays} days passed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#090D18] border border-slate-800 mb-4">
            <div>
              <span className="text-[11px] text-slate-400 block">Current Spent</span>
              <span className="text-xl font-bold text-white">{format(forecastData.metrics.currentSpending)}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Daily Run Rate</span>
              <span className="text-xl font-bold text-indigo-400">{format(forecastData.metrics.dailyRunRate)}/day</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Projected Total</span>
              <span className={`text-xl font-bold ${forecastData.metrics.willOverrunBudget ? 'text-red-400' : 'text-green-400'}`}>
                {format(forecastData.metrics.projectedTotal)}
              </span>
            </div>
          </div>

          {forecastData.aiExplanation && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>AI Projection Scenario:</strong> {forecastData.aiExplanation}
            </div>
          )}
        </div>
      )}

      {/* Structured Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identified Observations */}
        <div className="card-glass p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Key Financial Observations</span>
          </div>

          {insights.length > 0 ? (
            insights.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#090D18] border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{item.title}</span>
                  <span
                    className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      item.type === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : item.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 py-4">No observations recorded yet.</div>
          )}
        </div>

        {/* Actionable Saving Suggestions */}
        <div className="card-glass p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Actionable Saving Recommendations</span>
          </div>

          {savingSuggestions.length > 0 ? (
            savingSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#090D18] border border-slate-800 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-relaxed">{suggestion}</span>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-[#090D18] text-xs text-slate-400 space-y-2">
              <p>• Aim to save at least 20% of monthly income into an emergency fund.</p>
              <p>• Review recurring subscriptions periodically to cancel inactive tools.</p>
              <p>• Cook 2-3 more meals at home weekly to reduce discretionary food delivery costs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Category MoM Comparison Breakdown Table */}
      {metrics?.categoryBreakdown && metrics.categoryBreakdown.length > 0 && (
        <div className="card-glass p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1">Category Month-over-Month Variance</h3>
          <p className="text-xs text-slate-400 mb-4">Comparing {metrics.previousMonth} vs {metrics.month}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D18] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Spent This Month</th>
                  <th className="py-2.5 px-3">Spent Last Month</th>
                  <th className="py-2.5 px-3">Difference</th>
                  <th className="py-2.5 px-3 text-right">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {metrics.categoryBreakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-white">{row.category}</td>
                    <td className="py-2.5 px-3 text-slate-200">{format(row.currentSpent)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{format(row.previousSpent)}</td>
                    <td className="py-2.5 px-3">
                      <span className={row.diff > 0 ? 'text-red-400' : row.diff < 0 ? 'text-green-400' : 'text-slate-400'}>
                        {row.diff > 0 ? `+${format(row.diff)}` : row.diff < 0 ? `-${format(Math.abs(row.diff))}` : '0'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-semibold ${row.percentChange > 0 ? 'text-red-400' : row.percentChange < 0 ? 'text-green-400' : 'text-slate-400'}`}>
                        {row.percentChange > 0 ? `+${row.percentChange}%` : `${row.percentChange}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
