import React from 'react';
import { formatINR } from '../utils/format';
import { X, Trash2, ArrowRight, PackageOpen, CheckCircle } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onRemoveItem, onCheckout }) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between p-6 sm:p-7 animate-in slide-in-from-right duration-200">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Shopping Cart</span>
                <h3 className="font-display text-xl font-bold text-slate-900">Your BuildFlow Order</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Container */}
            <div className="py-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <PackageOpen className="w-10 h-10 mx-auto mb-3 text-slate-300 stroke-1" />
                  <p className="font-medium text-slate-500">Your cart is currently empty.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Configure a custom rig or add components to get started.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div 
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 max-w-[240px]">
                      <span className="font-bold text-slate-900 block truncate">{item.title}</span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {formatINR(item.price)} {item.quantity > 1 ? `× ${item.quantity}` : ''}
                      </span>
                    </div>
                    <button 
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-white transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Footer */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex justify-between text-sm font-semibold text-slate-900">
              <span>Subtotal (INR)</span>
              <span className="font-mono text-base font-bold text-red-600 tabular-nums">
                {formatINR(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Clean-room hand assembly, 48-hr QA stress testing, and insured express delivery included free of charge.
            </p>
            <button 
              onClick={onCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3.5 px-4 text-sm font-semibold text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                cart.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-600/25'
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
