import React, { useState } from 'react';
import { LogIn, UserPlus, X, Zap, Shield, User, Wrench, ClipboardCheck, Package, Truck } from 'lucide-react';
import { login, register } from '../utils/api';

export const ROLES = [
  { role: 'Customer',   label: 'Customer',    icon: '🛒', desc: 'Hardware Store & Custom Studio', email: 'customer@buildflow.dev' },
  { role: 'Technician', label: 'Technician',  icon: '🔧', desc: 'Assembly Line & POST Station',   email: 'technician@buildflow.dev' },
  { role: 'Inspector',  label: 'QA Inspector',icon: '📋', desc: 'Thermal Bench & Stress Testing',  email: 'inspector@buildflow.dev' },
  { role: 'Warehouse',  label: 'Warehouse',   icon: '📦', desc: 'Inventory Stock & Picking',       email: 'warehouse@buildflow.dev' },
  { role: 'Logistics',  label: 'Logistics',   icon: '🚚', desc: 'Dispatch & Courier Tracking',     email: 'logistics@buildflow.dev' },
  { role: 'Admin',      label: 'Admin',       icon: '⚡', desc: 'Platform & RBAC Administration',  email: 'admin@buildflow.dev' },
];

const DEMO_PASSWORD = 'Demo@1234';

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Customer'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

  if (!isOpen) return null;

  const update = (event) => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let session;
      if (mode === 'register') {
        const regRes = await register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role || 'Customer'
        });
        if (regRes?.accessToken) {
          session = regRes;
        } else {
          session = await login({ email: form.email, password: form.password, role: form.role || 'Customer' });
        }
      } else {
        session = await login({
          email: form.email,
          password: form.password,
          role: form.role
        });
      }
      onAuthenticated(session);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (acct) => {
    setError('');
    setDemoLoading(acct.email);
    try {
      const session = await login({ email: acct.email, password: DEMO_PASSWORD, role: acct.role });
      onAuthenticated(session);
      onClose();
    } catch (err) {
      setError(`Demo login failed for ${acct.role}: ${err.message}. Ensure seedUsers.js has been run.`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-slate-200 overflow-hidden relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Secure Portal
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mt-1">
              {mode === 'login' ? 'Sign In to Station' : 'Create Role Account'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors" 
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">First Name</label>
                <input 
                  required 
                  name="firstName" 
                  value={form.firstName} 
                  onChange={update} 
                  placeholder="e.g. Marcus" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Last Name</label>
                <input 
                  required 
                  name="lastName" 
                  value={form.lastName} 
                  onChange={update} 
                  placeholder="e.g. Chen" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
                />
              </div>
            </div>
          )}

          {/* Role Selection for both Sign In and Registration */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{mode === 'login' ? 'Select Target Role / Portal' : 'Select Account Role'}</span>
            </label>
            <div className="relative">
              <select 
                required 
                name="role" 
                value={form.role || 'Customer'} 
                onChange={update} 
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer"
              >
                {ROLES.map(r => (
                  <option key={r.role} value={r.role}>
                    {r.icon} {r.label} — ({r.desc})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {mode === 'login' 
                ? 'Your session will be directed to this role\'s curated workstation dashboard.'
                : 'Role permissions will be granted upon registration.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email Address</label>
            <input 
              required 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={update} 
              placeholder="you@buildflow.dev" 
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Password</label>
            <input 
              required 
              minLength={6} 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={update} 
              placeholder="••••••••" 
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              ⚠️ {error}
            </div>
          )}

          <button 
            disabled={submitting} 
            className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-red-600/20"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Authenticating...' : mode === 'login' ? `Sign In as ${form.role || 'Customer'}` : `Create ${form.role || 'Customer'} Account`}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} 
            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Need a new account? Register with role' : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Quick Demo Login — performs real JWT auth for all 6 roles */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                1-Click Demo Logins (Real JWT Auth):
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(acct => (
              <button
                key={acct.role}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(acct)}
                className="p-2 border border-slate-200 hover:border-red-500 hover:bg-red-50/60 rounded-lg text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:opacity-50 group text-center"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">
                  {demoLoading === acct.email ? '⏳' : acct.icon}
                </span>
                <span className="text-slate-800 font-bold">{acct.label}</span>
                <span className="text-[9px] text-slate-400 truncate w-full">{acct.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
