import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Coins,
  DollarSign,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Users,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    currency: 'INR',
    monthlyIncome: '',
    monthlyBudget: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register({
      ...formData,
      monthlyIncome: Number(formData.monthlyIncome) || 0,
      monthlyBudget: Number(formData.monthlyBudget) || 0
    });
    setLoading(false);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D18] flex flex-col lg:flex-row font-sans text-white relative selection:bg-purple-500 selection:text-white">
      {/* LEFT COLUMN: AUTH FORM */}
      <div className="w-full lg:w-1/2 xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10 overflow-y-auto">
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
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Fintech SaaS
              </span>
            </div>
          </Link>
          <div className="text-xs text-slate-400">
            Have an account?{' '}
            <Link to="/login" className="text-purple-400 font-semibold hover:text-purple-300 transition">
              Sign In
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-6 max-w-md w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-sm text-slate-400">
              Start intelligent personal finance tracking powered by verified deterministic algorithms.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Het Modi"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password (min 6 characters) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <div className="relative">
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white outline-none transition cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Monthly Income
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    placeholder="80000"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Monthly Spending Budget Target
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  name="monthlyBudget"
                  value={formData.monthlyBudget}
                  onChange={handleChange}
                  placeholder="50000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101727] border border-slate-700/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/30 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 font-semibold hover:text-purple-300 transition">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 text-center lg:text-left">
          © 2026 SpendSense AI. Smart Personal Finance & Expense Intelligence.
        </div>
      </div>

      {/* RIGHT COLUMN: FINANCIAL HERO PHOTO & VISUAL FEATURES */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative bg-[#101727] overflow-hidden items-center justify-center p-8 xl:p-14">
        {/* Real Fintech/Financial Photo Background */}
        <img
          src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1600&auto=format&fit=crop"
          alt="Smart Financial Intelligence"
          className="absolute inset-0 w-full h-full object-cover opacity-25 filter saturate-150 contrast-125"
        />

        {/* Dark FinTech Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#090D18] via-[#101727]/85 to-[#090D18]/90" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-medium backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Next-Generation Financial Architecture</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Start building wealth with{' '}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 bg-clip-text text-transparent">
                intelligent transparency.
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Eliminate guesswork. Every budget calculation and group expense split is mathematically verified by our backend engine.
            </p>
          </div>

          {/* Feature Showcase Cards */}
          <div className="space-y-3.5 pt-2">
            {/* Feature 1: Natural Language AI Expense Parsing */}
            <div className="p-4 rounded-2xl bg-[#141E30]/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Natural-Language Quick Entry</div>
                  <div className="text-[11px] text-slate-400">"Paid ₹350 for dinner at Domino's using UPI"</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#090D18]/80 border border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between">
                <span>Food • ₹350 • UPI • Resolved Yesterday</span>
                <span className="text-slate-400 text-[10px]">Auto-Structured</span>
              </div>
            </div>

            {/* Feature 2: Category Budgeting */}
            <div className="p-4 rounded-2xl bg-[#141E30]/80 backdrop-blur-xl border border-purple-500/30 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Category-Wise Budget Guardrails</span>
                </div>
                <span className="text-xs font-bold text-purple-300">4 Alert Tiers</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-[#090D18]/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">50%</div>
                  <div className="text-[11px] font-bold text-blue-400">Info</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090D18]/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">75%</div>
                  <div className="text-[11px] font-bold text-amber-400">Warning</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090D18]/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">90%</div>
                  <div className="text-[11px] font-bold text-orange-400">Critical</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090D18]/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">100%</div>
                  <div className="text-[11px] font-bold text-rose-400">Exceeded</div>
                </div>
              </div>
            </div>

            {/* Feature 3: Roommate Shared Expenses */}
            <div className="p-3.5 rounded-2xl bg-[#141E30]/60 backdrop-blur-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">Splitwise-Style Roommate Groups</span> • Equal & Custom Splits
                </div>
              </div>
              <span className="text-[11px] font-semibold text-purple-400">Auto-Balancing</span>
            </div>
          </div>

          {/* Security & Math Guarantee Badge */}
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero hallucinated numbers. Deterministic Node.js calculations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
