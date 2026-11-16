import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, Loader2, KeyRound, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
      toast.success(res.data.message || 'Password reset token generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setResetting(true);
    try {
      const res = await api.post(`/auth/reset-password/${resetToken}`, {
        password: newPassword
      });
      toast.success('Password successfully reset! Please log in.');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D18] flex flex-col lg:flex-row font-sans text-white relative selection:bg-purple-500 selection:text-white">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                SpendSense<span className="text-purple-400">.AI</span>
              </span>
            </div>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>

        {/* Center Card */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Recover Account Access
            </h1>
            <p className="text-sm text-slate-400">
              Enter your registered email address to receive password recovery instructions.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/30 disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Reset Token'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Reset token generated! Set your new password below.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Set New Password'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
            >
              Remember your password? Return to login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 text-center lg:text-left">
          © 2026 SpendSense AI. Secure Password Recovery.
        </div>
      </div>

      {/* RIGHT COLUMN: FINANCIAL PHOTO & SECURITY OVERVIEW */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative bg-[#101727] overflow-hidden items-center justify-center p-8 xl:p-14">
        <img
          src="https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=1600&auto=format&fit=crop"
          alt="Financial Security"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter saturate-150 contrast-125"
        />

        <div className="absolute inset-0 bg-gradient-to-tr from-[#090D18] via-[#101727]/85 to-[#090D18]/90" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Account Security & Privacy Protection</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Protected by modern{' '}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
              cryptographic standards.
            </span>
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Your personal credentials are salted and hashed with bcrypt. SpendSense AI does not store raw passwords and never shares sensitive financial data.
          </p>

          <div className="p-4 rounded-2xl bg-[#141E30]/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-200 font-semibold">Self-Service Tokenized Reset</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-200 font-semibold">Strict Expiring Recovery Windows</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
