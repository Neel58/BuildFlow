import React from 'react';
import { PhoneCall, ShoppingBag, Zap, ChevronRight } from 'lucide-react';

export default function Navbar({ currentRoute, setCurrentRoute, cartCount, onOpenCart, onOpenAuth, user, onLogout }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Zone 1: Single element brand wordmark */}
        <button 
          onClick={() => {
            setCurrentRoute('home');
            window.history.pushState({}, '', '/');
          }}
          className="flex items-center gap-3 text-slate-900 group cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-orange-400 flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-950 flex items-center">
              Build<span className="text-red-600">Flow</span>
            </span>
          </div>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button 
            onClick={() => {
              setCurrentRoute('home');
              window.history.pushState({}, '', '/');
            }}
            className={`${currentRoute === 'home' ? 'text-red-600 font-semibold' : 'hover:text-red-600'} transition-colors cursor-pointer`}
          >
            Home
          </button>
          
          <button 
            onClick={() => {
              setCurrentRoute('builder');
              window.history.pushState({}, '', '/builder');
            }}
            className={`${currentRoute === 'builder' ? 'text-red-600 font-semibold' : 'hover:text-red-600'} flex items-center gap-1 transition-colors cursor-pointer`}
          >
            <span>Custom PC Builder</span>
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">STUDIO</span>
          </button>

          <a href="#catalog" className="hover:text-red-600 transition-colors">Components</a>
          <a href="#tracking-section" className="hover:text-red-600 transition-colors">Order Tracking</a>
          <a href="#process" className="hover:text-red-600 transition-colors">Assembly & QA</a>
          <a href="#flagships" className="hover:text-red-600 transition-colors">Workstations</a>
        </nav>

        {/* Zone 3: Actions (Phone + Cart Button + Primary CTA) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <button onClick={onLogout} className="hidden sm:block text-xs font-semibold text-slate-600 hover:text-red-600">
              Sign out
            </button>
          ) : (
            <button onClick={onOpenAuth} className="hidden sm:block text-xs font-semibold text-slate-600 hover:text-red-600">
              Sign in
            </button>
          )}
          <a 
            href="tel:18002845335" 
            className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-500" />
            <span>+1 (800) 284-5335</span>
          </a>

          {/* Cart Trigger */}
          <button 
            onClick={onOpenCart}
            className="relative p-2 text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </button>

          {/* Primary CTA: Start Custom Build */}
          <button 
            onClick={() => {
              setCurrentRoute('builder');
              window.history.pushState({}, '', '/builder');
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm shadow-red-600/25 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>Start Custom Build</span>
            <ChevronRight className="w-4 h-4 hidden sm:inline" />
          </button>
        </div>

      </div>
    </header>
  );
}
