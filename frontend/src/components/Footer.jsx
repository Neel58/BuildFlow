import React from 'react';
import { Zap, PhoneCall, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-white border-t border-slate-200 py-16 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-orange-400 flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-950">
              Build<span className="text-red-600">Flow</span>
            </span>
          </div>

          <p className="text-slate-500 max-w-sm leading-relaxed">
            Enterprise custom PC assembly, automated wattage/socket compatibility engine, clean-room hand building, and certified 48-hour burn-in stress testing across India.
          </p>

          <div className="pt-2 flex items-center gap-4 text-slate-400">
            <span>&copy; {new Date().getFullYear()} BuildFlow Technologies Pvt Ltd. All rights reserved.</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">Studio Navigation</h4>
          <ul className="space-y-2.5">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-red-600 transition-colors cursor-pointer">
                Home Overview
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('builder')} className="hover:text-red-600 transition-colors font-semibold text-slate-900 cursor-pointer">
                Start Custom Build (Studio)
              </button>
            </li>
            <li>
              <a href="#flagships" className="hover:text-red-600 transition-colors">
                Pre-Built Flagships
              </a>
            </li>
            <li>
              <a href="#catalog" className="hover:text-red-600 transition-colors">
                Hardware Inventory
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">Precision Engineering</h4>
          <ul className="space-y-2.5">
            <li><a href="#process" className="hover:text-red-600 transition-colors">ISO 9001 Cleanroom</a></li>
            <li><a href="#process" className="hover:text-red-600 transition-colors">48-Hr QA Burn-in Protocol</a></li>
            <li><a href="#process" className="hover:text-red-600 transition-colors">Instapak Expanding Foam</a></li>
            <li><a href="#hero" className="hover:text-red-600 transition-colors">3-Year Zero-Downtime Warranty</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-4">Backend & API</h4>
          <ul className="space-y-2.5">
            <li><a href="/api" target="_blank" className="hover:text-red-600 transition-colors">REST API Spec</a></li>
            <li><a href="/api/health" target="_blank" className="hover:text-red-600 transition-colors">Service Health (UP)</a></li>
            <li><a href="/api/components" target="_blank" className="hover:text-red-600 transition-colors">Components Endpoint</a></li>
            <li>
              <a href="tel:18002845335" className="hover:text-red-600 transition-colors font-medium flex items-center gap-1.5 text-slate-900">
                <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                <span>+1 (800) 284-5335</span>
              </a>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
