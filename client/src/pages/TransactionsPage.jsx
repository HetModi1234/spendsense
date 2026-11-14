import React, { useState, useEffect } from 'react';
import {
  Plus,
  Wand2,
  Upload,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Receipt
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../context/CurrencyContext';
import AddTransactionModal from '../components/AddTransactionModal';
import AIQuickEntryModal from '../components/AIQuickEntryModal';
import CSVImportModal from '../components/CSVImportModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import DuplicateAlertBanner from '../components/DuplicateAlertBanner';

const DEFAULT_CATEGORIES = [
  'All',
  'Food',
  'Shopping',
  'Transportation',
  'Housing',
  'Bills',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Subscriptions',
  'Personal care',
  'Salary',
  'Freelancing',
  'Business',
  'Investments',
  'Other'
];

export default function TransactionsPage() {
  const { format } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals & Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Duplicates
  const [duplicates, setDuplicates] = useState([]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDuplicates = async () => {
    try {
      const res = await api.get('/transactions/duplicates');
      setDuplicates(res.data.data || []);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchDuplicates();
  }, [pagination.page, selectedCategory, selectedType, sortBy, sortOrder, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/transactions/${deletingId}`);
      toast.success('Transaction deleted');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchTransactions();
      fetchDuplicates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const handleReviewDuplicate = async (txId) => {
    try {
      await api.patch(`/transactions/${txId}/duplicate-status`, { status: 'reviewed' });
      toast.success('Marked as reviewed');
      fetchDuplicates();
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to update duplicate status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transactions</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Manage, filter, import and track your income and expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141E30] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-[#1E293B] transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Entry</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banners (if any) */}
      {duplicates.length > 0 && (
        <div className="space-y-3">
          {duplicates.map((dup, idx) => (
            <DuplicateAlertBanner
              key={idx}
              duplicate={dup}
              onReview={handleReviewDuplicate}
              onDelete={(id) => {
                setDeletingId(id);
                setDeleteConfirmOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-glass p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, merchant or notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090D18] border border-slate-700/80 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
            />
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700/80 text-xs text-white outline-none focus:border-purple-500"
            >
              {DEFAULT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700/80 text-xs text-white outline-none focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split('-');
                setSortBy(by);
                setSortOrder(ord);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700/80 text-xs text-white outline-none focus:border-purple-500"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span>Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-xs text-white outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#090D18] border border-slate-800 text-xs text-white outline-none"
          />
          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
              }}
              className="text-purple-400 hover:text-purple-300 underline ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card-glass rounded-2xl overflow-hidden border border-[#1E293B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#101727] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1E293B]">
              <tr>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Merchant</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-5 bg-slate-800/60 rounded" />
                    </td>
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            tx.type === 'income' ? 'bg-green-400' : 'bg-purple-400'
                          }`}
                        />
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                      {tx.description}
                      {tx.duplicateStatus === 'potential' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Possible Dup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{tx.merchant || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 uppercase text-[10px]">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold text-sm ${
                          tx.type === 'income' ? 'text-green-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTransaction(tx);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(tx._id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#101727] border-t border-[#1E293B] text-xs text-slate-400">
            <div>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={() => {
          fetchTransactions();
          fetchDuplicates();
        }}
        initialData={editingTransaction}
      />

      <AIQuickEntryModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          fetchDuplicates();
        }}
      />

      <CSVImportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          fetchDuplicates();
        }}
      />

      <ConfirmationDialog
        isOpen={deleteConfirmOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction record? This financial entry will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
