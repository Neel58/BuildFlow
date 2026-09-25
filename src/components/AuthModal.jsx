import React, { useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { login, register } from '../utils/api';

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">BuildFlow Account</span>
            <h2 className="font-display text-2xl font-bold text-slate-900">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700" aria-label="Close account dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <input required name="firstName" value={form.firstName} onChange={update} placeholder="First name" className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm" />
              <input required name="lastName" value={form.lastName} onChange={update} placeholder="Last name" className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm" />
            </div>
          )}
          <input required type="email" name="email" value={form.email} onChange={update} placeholder="Email address" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm" />
          <input required minLength={6} type="password" name="password" value={form.password} onChange={update} placeholder="Password" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button disabled={submitting} className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full mt-4 text-xs font-semibold text-slate-500 hover:text-red-600">
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
