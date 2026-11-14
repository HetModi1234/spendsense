import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  PiggyBank,
  Sparkles,
  BotMessageSquare,
  Users2,
  FileBarChart2,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Wand2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';
import AIQuickEntryModal from '../components/AIQuickEntryModal';
import AddTransactionModal from '../components/AddTransactionModal';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ReceiptText },
  { name: 'Budgets', path: '/budgets', icon: PiggyBank },
  { name: 'AI Insights', path: '/insights', icon: Sparkles, badge: 'AI' },
  { name: 'AI Assistant', path: '/assistant', icon: BotMessageSquare, badge: 'GenAI' },
  { name: 'Shared Expenses', path: '/groups', icon: Users2 },
  { name: 'Reports', path: '/reports', icon: FileBarChart2 },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { currency, setCurrency, symbol } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setUnreadCount(res.data.unreadCount || 0);
      } catch (e) {
        // Silent
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTransactionAdded = () => {
    // Notify window for views to re-fetch
    window.dispatchEvent(new Event('spendsense_transaction_added'));
  };

  return (
    <div className="flex h-screen bg-[#090D18] text-[#F8FAFC] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#101727] border-r border-[#1E293B]/70 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-[#1E293B]/70">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
              SpendSense<span className="text-purple-400 font-extrabold ml-1">AI</span>
            </div>
            <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">
              Finance Intelligence
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40 border border-purple-400/20 active:scale-[0.98]"
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Quick Entry</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-[#94A3B8] hover:text-white hover:bg-slate-800/40'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer with User Card */}
        <div className="p-3 border-t border-[#1E293B]/70 bg-[#0c1220]">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300 shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs text-[#94A3B8] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-[#101727]/90 backdrop-blur-md border-b border-[#1E293B]/70 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Financial Dashboard
              </span>
              <div className="text-sm text-slate-300 font-medium">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Pill */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-[#141E30] border border-[#1E293B] text-xs font-semibold text-purple-300 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
              <option value="CAD">CA$ CAD</option>
            </select>

            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </NavLink>

            {/* Add Transaction Button */}
            <button
              onClick={() => setIsAddTxModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs sm:text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </header>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#090D18]">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-[#101727] h-full shadow-2xl z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-lg text-white">SpendSense AI</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAIModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm"
              >
                <Wand2 className="w-4 h-4" />
                <span>AI Quick Entry</span>
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300'
                          : 'text-[#94A3B8] hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-red-400 hover:bg-slate-800/50 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Quick Entry Modal */}
      {isAIModalOpen && (
        <AIQuickEntryModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSuccess={handleTransactionAdded}
        />
      )}

      {/* Manual Add Transaction Modal */}
      {isAddTxModalOpen && (
        <AddTransactionModal
          isOpen={isAddTxModalOpen}
          onClose={() => setIsAddTxModalOpen(false)}
          onSuccess={handleTransactionAdded}
        />
      )}
    </div>
  );
}
