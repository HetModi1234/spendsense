import React from 'react';
import { AlertTriangle, Check, Trash2, Eye } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function DuplicateAlertBanner({
  duplicate,
  onKeepBoth,
  onDelete,
  onReview
}) {
  const { format } = useCurrency();
  const { transactionA, transactionB, reason } = duplicate;

  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Possible Duplicate Transaction Detected
            </div>
            <p className="text-xs text-slate-300 mt-1">{reason}</p>

            {/* Comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#090D18]/80 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Existing</span>
                <div className="font-semibold text-white">{transactionB.description || transactionB.merchant}</div>
                <div className="text-slate-400 text-[11px]">
                  {format(transactionB.amount)} • {new Date(transactionB.date).toLocaleDateString()}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090D18]/80 border border-amber-500/30">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Candidate</span>
                <div className="font-semibold text-white">{transactionA.description || transactionA.merchant}</div>
                <div className="text-slate-400 text-[11px]">
                  {format(transactionA.amount)} • {new Date(transactionA.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
          <button
            onClick={() => onReview?.(transactionA._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span>Mark Reviewed</span>
          </button>
          <button
            onClick={() => onDelete?.(transactionA._id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition border border-red-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Duplicate</span>
          </button>
        </div>
      </div>
    </div>
  );
}
