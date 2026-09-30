import React, { useState } from 'react';
import { LogIn, UserPlus, X, Zap } from 'lucide-react';
import { login, register } from '../utils/api';

// Demo accounts — all created by seedUsers.js with real bcrypt hashes.
// Clicking these performs a REAL POST /api/auth/login, returns a real JWT.
const DEMO_ACCOUNTS = [
  { role: 'Customer',   label: 'Customer',    icon: '🛒', email: 'customer@buildflow.dev'   },
  { role: 'Technician', label: 'Technician',  icon: '🔧', email: 'technician@buildflow.dev' },
  { role: 'Inspector',  label: 'QA Inspector',icon: '📋', email: 'inspector@buildflow.dev'  },
  { role: 'Warehouse',  label: 'Warehouse',   icon: '📦', email: 'warehouse@buildflow.dev'  },
  { role: 'Logistics',  label: 'Logistics',   icon: '🚚', email: 'logistics@buildflow.dev'  },
  { role: 'Admin',      label: 'Admin',       icon: '⚡', email: 'admin@buildflow.dev'      },
];

const DEMO_PASSWORD = 'Demo@1234';

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // email of demo acct being loaded

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

  // Real login for demo accounts — performs actual POST /api/auth/login, returns real JWT
  const handleDemoLogin = async (acct) => {
    setError('');
    setDemoLoading(acct.email);
    try {
      const session = await login({ email: acct.email, password: DEMO_PASSWORD });
      onAuthenticated(session);
      onClose();
    } catch (err) {
      setError(`Demo login failed for ${acct.role}: ${err.message}. Ensure seedUsers.js has been run.`);
    } finally {
      setDemoLoading(null);
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

        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full mt-3 text-xs font-semibold text-slate-500 hover:text-red-600">
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>

        {/* Quick Demo Login — performs REAL POST /api/auth/login for each seeded account */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2 justify-center">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Demo Login (real JWT auth):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(acct => (
              <button
                key={acct.role}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(acct)}
                className="p-2 border border-slate-200 hover:border-red-500 hover:bg-red-50 rounded-lg text-[11px] font-semibold text-slate-700 flex flex-col items-center gap-0.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{demoLoading === acct.email ? '⏳' : acct.icon}</span>
                <span>{acct.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
