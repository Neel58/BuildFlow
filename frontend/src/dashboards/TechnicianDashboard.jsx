import React from 'react';
import { clearSession } from '../utils/api';
import { LogOut, Wrench, Cpu, CheckCircle } from 'lucide-react';

export default function TechnicianDashboard({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      <header className="bg-blue-600 text-white px-6 py-3 shadow-lg flex justify-between items-center border-b-4 border-blue-800">
        <div className="flex items-center gap-3">
          <Wrench className="w-6 h-6" />
          <h1 className="font-bold text-xl tracking-wide uppercase">Technician Station</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-100 font-mono text-sm">TECH_{user?.firstName.toUpperCase()}</span>
          <button onClick={() => { clearSession(); onLogout(); }} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 rounded font-bold text-sm transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Exit Station
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex gap-6">
        <div className="w-1/3 flex flex-col gap-6">
          <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-xl">
            <h2 className="text-blue-400 font-bold mb-4 flex items-center gap-2 uppercase text-sm tracking-wider">
              <Cpu className="w-4 h-4" /> Assigned Builds
            </h2>
            <div className="space-y-3">
              <div className="bg-slate-700 p-4 rounded border-l-4 border-blue-500 cursor-pointer hover:bg-slate-600 transition-colors">
                <p className="text-white font-mono font-bold">ORD-8924</p>
                <p className="text-slate-300 text-sm mt-1">High-End Gaming Rig</p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-1 bg-slate-800 text-xs font-bold rounded text-slate-300">AM5</span>
                  <span className="px-2 py-1 bg-slate-800 text-xs font-bold rounded text-slate-300">ATX</span>
                </div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded cursor-pointer hover:bg-slate-600 transition-colors">
                <p className="text-slate-400 font-mono font-bold">ORD-8925</p>
                <p className="text-slate-500 text-sm mt-1">Office Workstation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 shadow-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Select a build to begin assembly</h2>
          <p className="text-slate-400 max-w-md">Ensure all components from the pick list are present at your station before starting the build timer.</p>
        </div>
      </main>
    </div>
  );
}
