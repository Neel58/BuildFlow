import React, { useState } from 'react';
import { ShoppingBag, Zap, ChevronRight, User, Shield, ChevronDown, Check } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const DEMO_ROLES = [
  { id: 'Customer', label: 'Customer (Store & Builder)', icon: '🛒' },
  { id: 'Technician', label: 'Technician Station', icon: '🔧' },
  { id: 'Inspector', label: 'QA Inspector Station', icon: '📋' },
  { id: 'Warehouse', label: 'Warehouse Inventory', icon: '📦' },
  { id: 'Logistics', label: 'Logistics & Dispatch', icon: '🚚' },
  { id: 'Admin', label: 'Admin Operations', icon: '⚡' }
];

export default function Navbar({ cartCount, onOpenCart, onOpenAuth, user, onLogout, onSelectRole }) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const currentRole = user?.role || 'Customer';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <div className="flex items-center gap-8">
          {/* Zone 1: Single element brand wordmark */}
          <Link 
            to="/"
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
          </Link>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-slate-600">
            <NavLink 
              to="/builder"
              className={({ isActive }) => 
                `${isActive ? 'text-red-600 font-semibold' : 'hover:text-red-600'} flex items-center gap-1.5 transition-colors cursor-pointer`
              }
            >
              <span>Custom PC Builder</span>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded">STUDIO</span>
            </NavLink>

            <NavLink to="/components" className={({ isActive }) => `${isActive ? 'text-red-600 font-semibold' : 'hover:text-red-600'} transition-colors`}>Components</NavLink>
            <NavLink to="/orders" className={({ isActive }) => `${isActive ? 'text-red-600 font-semibold' : 'hover:text-red-600'} transition-colors`}>Order Tracking</NavLink>
            <NavLink to="/assembly-qa" className={({ isActive }) => `${isActive ? 'text-red-600 font-semibold' : 'hover:text-red-600'} transition-colors`}>Assembly & QA</NavLink>
            <NavLink to="/workstations" className={({ isActive }) => `${isActive ? 'text-red-600 font-semibold' : 'hover:text-red-600'} transition-colors`}>Workstations</NavLink>
          </nav>
        </div>

        {/* Zone 3: Actions (Role Dropdown + Sign in + Cart Button + Primary CTA) */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Switch user role or station"
            >
              <Shield className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden md:inline">Station:</span>
              <span className="text-red-600 font-bold">{currentRole}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Select Active Station / Role
                </div>
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setRoleMenuOpen(false);
                      if (onSelectRole) onSelectRole(role.id);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{role.icon}</span>
                      <span className={currentRole === role.id ? 'font-bold text-red-600' : 'text-slate-700'}>
                        {role.label}
                      </span>
                    </span>
                    {currentRole === role.id && <Check className="w-3.5 h-3.5 text-red-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <button onClick={onLogout} className="hidden sm:block text-xs font-semibold text-slate-600 hover:text-red-600">
              Sign out
            </button>
          ) : (
            <button onClick={onOpenAuth} className="hidden sm:block text-xs font-semibold text-slate-600 hover:text-red-600">
              Sign in
            </button>
          )}

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
          <Link 
            to="/builder"
            className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm shadow-red-600/25 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>Start Custom Build</span>
            <ChevronRight className="w-4 h-4 hidden sm:inline" />
          </Link>
        </div>

      </div>
    </header>
  );
}
