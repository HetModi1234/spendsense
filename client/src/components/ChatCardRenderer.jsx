import React from 'react';
import { useCurrency } from '../context/CurrencyContext';
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  AlertCircle,
  Receipt,
  Users2
} from 'lucide-react';

export default function ChatCardRenderer({ card }) {
  const { format, symbol } = useCurrency();
  const { type, data } = card;

  if (!data) return null;

  switch (type) {
    case 'MonthlySummaryCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-purple-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-purple-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Month Summary ({data.month})</span>
            </span>
            <span>{data.transactionCount} transactions</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Income</span>
              <span className="font-bold text-green-400">{format(data.income)}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Expenses</span>
              <span className="font-bold text-red-400">{format(data.expenses)}</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Savings</span>
              <span className="font-bold text-purple-300">{format(data.savings)}</span>
            </div>
          </div>
        </div>
      );

    case 'CategorySpendingCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-indigo-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5" />
              <span>Category: {data.category}</span>
            </span>
            <span className="text-white font-bold text-xs">{format(data.totalSpent)}</span>
          </div>
          {data.transactions && data.transactions.length > 0 && (
            <div className="divide-y divide-slate-800 pt-1">
              {data.transactions.map((tx, idx) => (
                <div key={idx} className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-300 truncate max-w-[180px]">{tx.description || tx.merchant}</span>
                  <span className="font-semibold text-slate-200">{format(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'BudgetStatusCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-amber-500/30 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-[10px] uppercase tracking-wider text-amber-400">
            <span>Budget Status ({data.month})</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20">{data.status}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                data.utilization >= 100
                  ? 'bg-red-500'
                  : data.utilization >= 75
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, data.utilization)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Spent: <strong className="text-white">{format(data.spent)}</strong></span>
            <span>Limit: <strong className="text-white">{format(data.totalBudget)}</strong></span>
            <span>Left: <strong className="text-green-400">{format(data.remaining)}</strong></span>
          </div>
        </div>
      );

    case 'ComparisonCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-purple-500/30 text-xs space-y-2">
          <div className="font-bold text-[10px] uppercase tracking-wider text-purple-400">
            Spending Trend Comparison
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">{data.comparedMonth} vs {data.currentMonth}</span>
            <span className={`font-bold flex items-center gap-1 ${data.increased ? 'text-red-400' : 'text-green-400'}`}>
              {data.increased ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {data.increased ? '+' : ''}{format(data.difference)} ({data.percentChange}%)
            </span>
          </div>
        </div>
      );

    case 'TopExpensesCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-xs space-y-1.5">
          <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
            Largest Transactions
          </div>
          <div className="divide-y divide-slate-800">
            {data.topExpenses?.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1.5">
                <div>
                  <div className="font-medium text-white">{item.description}</div>
                  <div className="text-[10px] text-slate-400">{item.category} • {item.date}</div>
                </div>
                <div className="font-bold text-white">{format(item.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'GroupBalancesCard':
      return (
        <div className="p-3.5 my-2.5 rounded-xl bg-[#090D18] border border-blue-500/30 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-blue-400">
            <Users2 className="w-3.5 h-3.5" />
            <span>Shared Roommate Balances</span>
          </div>
          {data.groups && data.groups.length > 0 ? (
            data.groups.map((g, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 text-[11px]">
                <span className="text-white font-medium">{g.groupName}</span>
                <span
                  className={`font-bold ${
                    g.myNetBalance > 0
                      ? 'text-green-400'
                      : g.myNetBalance < 0
                      ? 'text-red-400'
                      : 'text-slate-400'
                  }`}
                >
                  {g.myNetBalance > 0 ? `+${format(g.myNetBalance)} (owed)` : g.myNetBalance < 0 ? `${format(g.myNetBalance)} (you owe)` : 'Settled'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-[11px]">No active groups.</div>
          )}
        </div>
      );

    default:
      return null;
  }
}
