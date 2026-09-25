import React from 'react';
import { clearSession } from '../utils/api';
import { LogOut, ClipboardCheck, AlertTriangle } from 'lucide-react';

export default function InspectorDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-700 text-white px-6 py-4 shadow flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6" />
          <h1 className="font-bold text-xl">Quality Assurance</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-teal-100 font-medium">Inspector: {user?.firstName}</span>
          <button onClick={() => { clearSession(); onLogout(); }} className="px-4 py-2 bg-teal-800 hover:bg-teal-900 rounded font-semibold text-sm transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready for Inspection</h2>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">There are currently no assembled PCs waiting for quality assurance. Check back later.</p>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-start gap-3 text-left max-w-lg mx-auto">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Notice</h4>
              <p className="text-sm mt-1">Remember to follow the 32-point checklist for all liquid-cooled builds.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
