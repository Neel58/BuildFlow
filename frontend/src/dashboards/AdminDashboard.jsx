import React from 'react';
import { clearSession } from '../utils/api';
import { LogOut, Users, Settings, Database, Activity } from 'lucide-react';

export default function AdminDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white">A</div>
          <h1 className="font-bold text-lg tracking-tight">Admin Portal</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-red-600/10 text-red-500 rounded-lg text-sm font-semibold">
            <Activity className="w-4 h-4" /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors">
            <Users className="w-4 h-4" /> User Management
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors">
            <Database className="w-4 h-4" /> System Logs
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>
        
        <button onClick={() => { clearSession(); onLogout(); }} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-sm transition-colors mt-auto">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-display font-bold">Welcome back, {user?.firstName}</h2>
          <p className="text-slate-400 mt-1">Here is what's happening across the BuildFlow platform today.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Total Users</h3>
            <p className="text-4xl font-light">1,248</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Active Orders</h3>
            <p className="text-4xl font-light text-blue-400">84</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">System Health</h3>
            <p className="text-4xl font-light text-emerald-400">99.9%</p>
          </div>
        </div>
      </main>
    </div>
  );
}
