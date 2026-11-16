import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Receipt,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@spendsense.ai');
    setPassword('password123');
    setLoading(true);
    const res = await login('demo@spendsense.ai', 'password123');
    setLoading(false);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D18] flex flex-col lg:flex-row font-sans text-white relative selection:bg-purple-500 selection:text-white">
      {/* LEFT COLUMN: AUTH FORM */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10">
        {/* Top Brand Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent">
                SpendSense<span className="text-purple-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Fintech SaaS
              </span>
            </div>
          </Link>
          <div className="text-xs text-slate-400">
            Need an account?{' '}
            <Link to="/register" className="text-purple-400 font-semibold hover:text-purple-300 transition">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Center Form Card */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-400">
              Sign in to manage expenses, track budgets & review verified AI financial insights.
            </p>
          </div>

          {/* Quick Demo Login Pill */}
          <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-200">Instant Demo Access</div>
                <div className="text-[11px] text-slate-400">Het Modi (demo@spendsense.ai)</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition active:scale-95 shadow-md shadow-purple-900/40 disabled:opacity-50"
            >
              One-Click Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/30 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In to SpendSense</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Proof Quote */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> 256-bit Bank Grade Security
            </span>
            <span className="text-slate-500">100% Verified Math</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 text-center lg:text-left">
          © 2026 SpendSense AI. Smart Personal Finance & Expense Intelligence.
        </div>
      </div>

      {/* RIGHT COLUMN: FINANCIAL HERO PHOTO & LIVE INTELLIGENCE CARDS */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative bg-[#101727] overflow-hidden items-center justify-center p-8 xl:p-14">
        {/* Real Fintech/Financial Photo Background */}
        <img
          src="https://images.unsplash.com/photo-1618042164219-62c820f10723?q=80&w=1600&auto=format&fit=crop"
          alt="SpendSense AI Financial Platform"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter saturate-150 contrast-125"
        />

        {/* Dark FinTech Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#090D18] via-[#101727]/85 to-[#090D18]/90" />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Foreground Content & Glassmorphism Financial Visuals */}
        <div className="relative z-10 w-full max-w-lg space-y-6">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium backdrop-blur-md">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Smart Expense Intelligence Platform</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Master your wealth with{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
                deterministic AI insights.
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time expense categorization, transparent budget tracking, and automated roommate settlement calculation.
            </p>
          </div>

          {/* Floating Financial Cards Container */}
          <div className="space-y-3.5 pt-2">
            {/* Card 1: Monthly Budget & Spending Live Preview */}
            <div className="p-4 rounded-2xl bg-[#141E30]/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl transition hover:border-purple-500/40">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Current Monthly Overview</div>
                    <div className="text-[11px] text-slate-400">₹48,250 spent of ₹65,000 budget</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  Healthy (74%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-[74%]" />
              </div>
            </div>

            {/* Card 2: Gemini AI Insights Bubble */}
            <div className="p-4 rounded-2xl bg-[#141E30]/80 backdrop-blur-xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-300">Gemini AI Intelligence</span>
                    <span className="text-[10px] text-slate-400">• Verified Analysis</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    "Your dining out expenses dropped 18% compared to last month. Net savings are on track to increase by ₹4,800."
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Roommate Splitwise Badge */}
            <div className="p-3.5 rounded-2xl bg-[#141E30]/60 backdrop-blur-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">Skyline Flatmates 402</span> • ₹3,000 electricity split
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">Settled</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#101727] flex items-center justify-center font-bold text-[10px] text-white">
                HM
              </div>
              <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#101727] flex items-center justify-center font-bold text-[10px] text-white">
                RK
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-[#101727] flex items-center justify-center font-bold text-[10px] text-white">
                JS
              </div>
            </div>
            <div className="text-[11px] text-slate-300">
              Trusted by smart professionals & roommates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
