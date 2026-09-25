import React from 'react';
import { clearSession } from '../utils/api';
import { LogOut, Truck, MapPin } from 'lucide-react';

export default function LogisticsDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-200 flex flex-col">
      <header className="bg-indigo-900 text-white px-6 py-4 shadow-xl flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <Truck className="w-7 h-7 text-indigo-400" />
          <h1 className="font-bold text-2xl font-display tracking-tight">Logistics Hub</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium">
            <MapPin className="w-4 h-4" /> Dispatch Center
          </div>
          <div className="h-6 w-px bg-indigo-700" />
          <button onClick={() => { clearSession(); onLogout(); }} className="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors text-sm font-bold">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 relative overflow-hidden flex items-center justify-center">
        {/* Decorative map pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
        
        <div className="bg-white p-10 rounded-2xl shadow-2xl relative z-10 max-w-lg w-full text-center">
          <Truck className="w-16 h-16 text-indigo-900 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No pending deliveries</h2>
          <p className="text-slate-500 mb-6">All verified builds have been dispatched or there are no new items awaiting shipping.</p>
          <button className="px-6 py-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all">
            Refresh Manifest
          </button>
        </div>
      </main>
    </div>
  );
}
