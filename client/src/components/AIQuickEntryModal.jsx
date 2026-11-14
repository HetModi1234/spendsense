import React, { useState } from 'react';
import { Wand2, X, AlertTriangle, CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_CATEGORIES = [
  'Food', 'Shopping', 'Transportation', 'Housing', 'Bills',
  'Healthcare', 'Education', 'Entertainment', 'Travel', 'Subscriptions',
  'Personal care', 'Salary', 'Freelancing', 'Investments', 'Other'
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

export default function AIQuickEntryModal({ isOpen, onClose, onSuccess }) {
  const { symbol } = useCurrency();
  const [inputText, setInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleParse = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) {
      toast.error('Please enter a description of your expense or income.');
      return;
    }

    setParsing(true);
    setErrorMsg('');
    try {
      const res = await api.post('/ai/parse-expense', { text: inputText.trim() });

      if (res.data.success && res.data.data) {
        setParsedData(res.data.data);
        if (res.data.note) {
          toast(res.data.note, { icon: 'ℹ️' });
        }
      } else if (res.data.needsClarification) {
        setErrorMsg(res.data.message || 'Please provide more details (e.g. include the amount).');
      } else {
        setErrorMsg(res.data.message || 'Failed to parse. Please try again or fill manually.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'AI Parsing failed. Please check your network or enter manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!parsedData) return;
    if (!parsedData.amount || Number(parsedData.amount) <= 0) {
      toast.error('Please specify a valid amount.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/transactions', {
        ...parsedData,
        amount: Number(parsedData.amount)
      });

      if (res.data.duplicateWarning) {
        toast(res.data.duplicateWarning, { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('Transaction added successfully!');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setParsedData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141E30] border border-purple-500/30 rounded-2xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">AI Quick Entry</h3>
              <p className="text-xs text-slate-400">Enter expenses in everyday natural language</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Natural Language Prompt Input */}
        {!parsedData && (
          <form onSubmit={handleParse} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Type or paste your transaction
              </label>
              <textarea
                rows={3}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='e.g., "Paid 450 rupees for lunch at Swiggy using UPI yesterday"'
                className="w-full px-4 py-3 rounded-xl bg-[#090D18] border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm text-white placeholder-slate-500 resize-none outline-none transition"
                autoFocus
              />
            </div>

            {/* Example prompt pills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-400">Quick suggestions:</div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  "Dinner at Domino's 350 using UPI yesterday",
                  "Uber ride 220 cash today",
                  "Amazon shopping 1499 credit card",
                  "Salary received 85000 bank transfer"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(sample)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={parsing || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Parsing with AI...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Extract Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Parsed Result Editable Preview */}
        {parsedData && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Details Extracted! Verify and edit before confirming.</span>
              </div>
              <button
                onClick={() => setParsedData(null)}
                className="text-xs text-slate-400 hover:text-purple-300 underline"
              >
                Try different text
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Type */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Type</label>
                <select
                  value={parsedData.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Amount ({symbol})</label>
                <input
                  type="number"
                  step="any"
                  value={parsedData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none font-bold text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Category</label>
                <select
                  value={parsedData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                >
                  {DEFAULT_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Payment Method</label>
                <select
                  value={parsedData.paymentMethod}
                  onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Merchant */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Merchant</label>
                <input
                  type="text"
                  value={parsedData.merchant || ''}
                  onChange={(e) => handleFieldChange('merchant', e.target.value)}
                  placeholder="e.g. Swiggy, Amazon"
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-slate-400 font-medium block mb-1">Date</label>
                <input
                  type="date"
                  value={parsedData.date ? parsedData.date.split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                />
              </div>

              {/* Description (Full width) */}
              <div className="col-span-2">
                <label className="text-slate-400 font-medium block mb-1">Description</label>
                <input
                  type="text"
                  value={parsedData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#090D18] border border-slate-700 text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setParsedData(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveTransaction}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
