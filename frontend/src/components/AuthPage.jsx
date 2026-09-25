import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../utils/api';

const ROLES = ['Customer', 'Admin', 'Warehouse', 'Technician', 'Inspector', 'Logistics'];

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Customer' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => setForm(prev => ({ ...prev, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'register') {
        await register(form);
        const session = await login({ email: form.email, password: form.password });
        onAuthenticated(session);
      } else {
        const session = await login({ email: form.email, password: form.password });
        onAuthenticated(session);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[100px]" />

      <div className="bg-white rounded-2xl w-full max-w-xl p-8 sm:p-10 shadow-2xl border border-slate-200 relative z-10">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 mb-2 block">BuildFlow Platform</span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {mode === 'login' ? 'Enter your credentials to access your portal' : 'Join the most advanced PC building platform'}
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input required type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input required minLength={6} type="password" name="password" value={form.password} onChange={update} placeholder="••••••••" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
              <select name="role" value={form.role} onChange={update} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white">
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100 flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button disabled={submitting} className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg shadow-red-600/20">
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign in securely' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors">
            {mode === 'login' ? (
              <span>New to BuildFlow? <span className="text-red-600">Create an account</span></span>
            ) : (
              <span>Already have an account? <span className="text-red-600">Sign in</span></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
