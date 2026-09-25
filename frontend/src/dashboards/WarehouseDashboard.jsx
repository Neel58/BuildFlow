import React from 'react';
import { clearSession } from '../utils/api';
import { LogOut, Package, Archive, RefreshCw } from 'lucide-react';

export default function WarehouseDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-amber-600 text-white px-6 py-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Archive className="w-6 h-6" />
          <h1 className="font-bold text-xl">Warehouse Operations</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-amber-100 text-sm">Operator: {user?.firstName}</span>
          <button onClick={() => { clearSession(); onLogout(); }} className="p-2 hover:bg-amber-700 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-medium mb-1 text-sm">Pending Picks</h3>
            <p className="text-3xl font-bold text-slate-800">24</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-medium mb-1 text-sm">Low Stock Alerts</h3>
            <p className="text-3xl font-bold text-red-600">8</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 font-medium mb-1 text-sm">Incoming Shipments</h3>
            <p className="text-3xl font-bold text-blue-600">3</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Active Pick Lists</h2>
            <button className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-semibold">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 flex-1">
            <Package className="w-16 h-16 mb-4 opacity-20" />
            <p>No active pick lists assigned to you right now.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
