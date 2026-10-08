import React, { useState } from 'react';
import { LogIn, UserPlus, Zap, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { ROLES } from './AuthModal';

const DEMO_PASSWORD = 'Demo@1234';

export default function AuthPage({ onAuthenticated }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Customer' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);

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
        session = await login({ email: form.email, password: form.password, role: form.role });
      }
      onAuthenticated(session);
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
    } catch (err) {
      setError(`Demo login failed for ${acct.role}: ${err.message}`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden py-12">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[100px]" />

      <div className="bg-white rounded-2xl w-full max-w-xl p-8 sm:p-10 shadow-2xl border border-slate-200 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Store
          </button>
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1">
            <Shield className="w-3 h-3 text-red-600" /> RBAC Console
          </span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign In to Portal' : 'Create Role Account'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {mode === 'login' 
              ? 'Select your designated role to be routed directly to your workstation.'
              : 'Register your identity and role assignment for BuildFlow RBAC.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input required name="firstName" value={form.firstName} onChange={update} placeholder="John" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                <input required name="lastName" value={form.lastName} onChange={update} placeholder="Doe" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>{mode === 'login' ? 'Target Role / Station Portal' : 'Designated Account Role'}</span>
              <span className="text-[10px] text-red-600 font-bold uppercase">Role-Based Access</span>
            </label>
            <select 
              name="role" 
              value={form.role} 
              onChange={update} 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-slate-50 text-slate-800 font-medium cursor-pointer"
            >
              {ROLES.map(r => (
                <option key={r.role} value={r.role}>
                  {r.icon} {r.label} — ({r.desc})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input required type="email" name="email" value={form.email} onChange={update} placeholder="you@buildflow.dev" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input required minLength={6} type="password" name="password" value={form.password} onChange={update} placeholder="••••••••" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100 flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button disabled={submitting} className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg shadow-red-600/20 cursor-pointer">
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {submitting ? 'Authenticating...' : mode === 'login' ? `Sign In as ${form.role}` : `Create ${form.role} Account`}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer">
            {mode === 'login' ? (
              <span>Need a new role account? <span className="text-red-600">Register</span></span>
            ) : (
              <span>Already registered? <span className="text-red-600">Sign in</span></span>
            )}
          </button>
        </div>

        {/* Demo 1-click accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2.5 justify-center">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Instant 1-Click Demo Testing:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(acct => (
              <button
                key={acct.role}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(acct)}
                className="p-2.5 border border-slate-200 hover:border-red-500 hover:bg-red-50 rounded-xl text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                <span className="text-base">{demoLoading === acct.email ? '⏳' : acct.icon}</span>
                <span className="font-bold text-slate-900">{acct.label}</span>
                <span className="text-[9px] text-slate-400">{acct.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
