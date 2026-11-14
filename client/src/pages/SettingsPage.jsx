import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Coins,
  Download,
  Trash2,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'preferences', 'security', 'privacy'

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    avatar: user?.avatar || '',
    timezone: user?.timezone || 'Asia/Kolkata',
    monthlyIncome: user?.monthlyIncome || 0,
    monthlyBudget: user?.monthlyBudget || 0
  });

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Privacy Dialogs
  const [wipeDataDialogOpen, setWipeDataDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/settings', profileForm);
      updateUser(res.data.data);
      toast.success('Profile and preferences updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/settings/export-data', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SpendSense_Personal_Data_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Personal data archive downloaded.');
    } catch (e) {
      toast.error('Failed to export personal data');
    }
  };

  const handleWipeFinancialData = async () => {
    setActionLoading(true);
    try {
      await api.delete('/settings/financial-data');
      toast.success('All transactions, budgets, and chats have been erased.');
      setWipeDataDialogOpen(false);
    } catch (e) {
      toast.error('Failed to wipe data');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setActionLoading(true);
    try {
      await api.delete('/settings/account');
      toast.success('Your account has been deleted.');
      logout();
    } catch (e) {
      toast.error('Failed to delete account');
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings & Preferences</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Manage your personal profile, security credentials, currency, and data privacy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="card-glass p-3 rounded-2xl md:col-span-1 space-y-1 text-xs">
          {[
            { id: 'profile', label: 'Profile & General', icon: User },
            { id: 'preferences', label: 'Financial Preferences', icon: Coins },
            { id: 'security', label: 'Security & Auth', icon: Shield },
            { id: 'privacy', label: 'Privacy & Data', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition text-left ${
                  activeTab === tab.id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Window */}
        <div className="card-glass p-6 rounded-2xl md:col-span-3">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Profile Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email (Read-Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18]/50 border border-slate-800 text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Timezone</label>
                  <select
                    value={profileForm.timezone}
                    onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Financial Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Financial Preferences</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  >
                    <option value="INR">INR (₹ Indian Rupee)</option>
                    <option value="USD">USD ($ US Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                    <option value="GBP">GBP (£ British Pound)</option>
                    <option value="CAD">CAD (CA$ Canadian Dollar)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Default Monthly Income Target</label>
                  <input
                    type="number"
                    value={profileForm.monthlyIncome}
                    onChange={(e) => setProfileForm({ ...profileForm, monthlyIncome: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Default Monthly Expense Target</label>
                  <input
                    type="number"
                    value={profileForm.monthlyBudget}
                    onChange={(e) => setProfileForm({ ...profileForm, monthlyBudget: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Preferences</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white mb-2">Change Password</h3>

              <div className="max-w-md space-y-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">New Password (min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#090D18] border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow"
                >
                  {savingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Privacy & Danger Zone */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Data Portability</h3>
                <p className="text-slate-400 mb-3">Download a complete JSON export of all your personal data, transactions, and budgets.</p>
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Personal Data Archive (JSON)</span>
                </button>
              </div>

              <div className="pt-4 border-t border-red-500/20 space-y-4">
                <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>

                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">Wipe All Financial Records</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Clears all transactions, monthly budgets, and conversation history while preserving your login.
                    </p>
                  </div>
                  <button
                    onClick={() => setWipeDataDialogOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold border border-red-500/30 transition shrink-0"
                  >
                    Wipe Financial Data
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">Permanently Delete Account</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Irrevocably deletes your user profile and all associated data from the SpendSense AI platform.
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteAccountDialogOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition shrink-0"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={wipeDataDialogOpen}
        title="Wipe All Financial Records"
        message="This action will permanently delete all your logged income, expenses, budgets, and AI chat histories. This cannot be undone. Are you sure?"
        confirmLabel="Wipe All Data"
        loading={actionLoading}
        onConfirm={handleWipeFinancialData}
        onClose={() => setWipeDataDialogOpen(false)}
      />

      <ConfirmationDialog
        isOpen={deleteAccountDialogOpen}
        title="Delete SpendSense Account"
        message="This will completely delete your account, your profile, your credentials, and all financial data. You will be logged out immediately. Are you absolutely certain?"
        confirmLabel="Permanently Delete Account"
        loading={actionLoading}
        onConfirm={handleDeleteAccount}
        onClose={() => setDeleteAccountDialogOpen(false)}
      />
    </div>
  );
}
