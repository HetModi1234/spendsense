import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food', 'Shopping', 'Transportation', 'Housing', 'Bills',
  'Healthcare', 'Education', 'Entertainment', 'Travel', 'Subscriptions',
  'Personal care', 'Other'
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Investments', 'Gifts', 'Other income'
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  merchant: z.string().optional(),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  date: z.string().min(1, 'Date is required'),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.string().optional()
});

export default function AddTransactionModal({ isOpen, onClose, onSuccess, initialData = null }) {
  const { symbol } = useCurrency();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      type: 'expense',
      amount: '',
      category: 'Food',
      merchant: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      notes: '',
      isRecurring: false,
      recurringFrequency: 'none'
    }
  });

  if (!isOpen) return null;

  const currentType = watch('type');
  const isRecurring = watch('isRecurring');

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      if (initialData?._id) {
        await api.put(`/transactions/${initialData._id}`, values);
        toast.success('Transaction updated successfully!');
      } else {
        const res = await api.post('/transactions', values);
        if (res.data.duplicateWarning) {
          toast(res.data.duplicateWarning, { icon: '⚠️', duration: 6000 });
        } else {
          toast.success('Transaction created successfully!');
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const categories = currentType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141E30] border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-semibold text-lg text-white">
            {initialData ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="flex p-1 bg-[#090D18] rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setValue('type', 'expense');
                setValue('category', DEFAULT_EXPENSE_CATEGORIES[0]);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                currentType === 'expense'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('type', 'income');
                setValue('category', DEFAULT_INCOME_CATEGORIES[0]);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                currentType === 'income'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Amount ({symbol}) *
              </label>
              <input
                type="number"
                step="any"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white font-bold text-base focus:border-purple-500 outline-none"
              />
              {errors.amount && (
                <p className="text-red-400 text-[11px] mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Date *</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              />
              {errors.date && (
                <p className="text-red-400 text-[11px] mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Category *</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-400 text-[11px] mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
              <select
                {...register('paymentMethod')}
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Description *</label>
              <input
                type="text"
                {...register('description')}
                placeholder="e.g. Grocery run, Dinner"
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              />
              {errors.description && (
                <p className="text-red-400 text-[11px] mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Merchant / Vendor</label>
              <input
                type="text"
                {...register('merchant')}
                placeholder="e.g. Domino's, Uber"
                className="w-full px-3 py-2.5 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Notes (Optional)</label>
            <input
              type="text"
              {...register('notes')}
              placeholder="Additional details..."
              className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
            />
          </div>

          {/* Recurring Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#090D18] border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-white">Recurring Transaction</div>
              <div className="text-[11px] text-slate-400">Repeats every month/week</div>
            </div>
            <input
              type="checkbox"
              {...register('isRecurring')}
              className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
            />
          </div>

          {isRecurring && (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Repeat Frequency</label>
              <select
                {...register('recurringFrequency')}
                className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white text-sm focus:border-purple-500 outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition shadow-lg shadow-purple-900/30 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update Transaction' : 'Save Transaction'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
