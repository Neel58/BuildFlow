import React, { useEffect, useState } from 'react';
import { X, Search, CheckCircle2, Clock, Truck, ShieldCheck, Box } from 'lucide-react';
import { apiRequest } from '../utils/api';

export default function OrderTrackingModal({ isOpen, onClose, initialOrderId }) {
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [searchedOrder, setSearchedOrder] = useState(null);

  const handleTrack = async () => {
    if (!orderId) return;
    try {
      const tracking = await apiRequest(`/api/logistics/${orderId}/tracking`);
      const status = tracking.status || 'Pending';
      const progressByStatus = { Pending: 10, Packaging: 60, Shipped: 80, Delivered: 100 };
      setSearchedOrder({
        id: orderId,
        rigName: 'Backend order',
        tech: 'Assigned by operations',
        phase: status,
        progress: progressByStatus[status] || 25,
        trackingNum: tracking.trackingNumber || 'Not assigned',
        eta: tracking.deliveredAt ? 'Delivered' : 'Pending logistics update',
        steps: [
          { label: 'Inventory Picked', done: ['Packaging', 'Shipped', 'Delivered'].includes(status) },
          { label: 'Cleanroom Assembly', done: ['Packaging', 'Shipped', 'Delivered'].includes(status) },
          { label: 'QA Multi-Stress Burn-in', done: ['Shipped', 'Delivered'].includes(status) },
          { label: 'Shipment Delivered', done: status === 'Delivered' }
        ]
      });
    } catch (error) {
      setSearchedOrder({ error: error.message, id: orderId });
    }
  };

  if (!isOpen) return null;

  const current = searchedOrder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Order Telemetry</span>
            <h3 className="font-display text-xl font-bold text-slate-900">
              {current ? `Order #${current.id}` : 'Track an order'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input for lookup */}
        <div className="flex gap-2">
          <input 
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter MongoDB order ID..."
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button 
            onClick={handleTrack}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track</span>
          </button>
        </div>

        {current?.error && <p className="text-xs text-red-600">{current.error}</p>}

        {/* Status card */}
        {current && !current.error && <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Target System:</span>
            <span className="font-bold text-slate-900">{current.rigName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Technician:</span>
            <span className="font-medium text-slate-900">{current.tech}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Active Phase:</span>
            <span className="text-red-600 font-bold">{current.phase}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tracking Reference:</span>
            <span className="font-mono text-slate-700">{current.trackingNum}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Estimated Delivery:</span>
            <span className="text-emerald-700 font-semibold">{current.eta}</span>
          </div>
        </div>}

        {/* Step-by-step progress */}
        {current && !current.error && <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Assembly Progress</span>
            <span className="text-red-600 font-mono">{current.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-red-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${current.progress}%` }}
            ></div>
          </div>
        </div>}

        {current && !current.error && <div className="grid grid-cols-2 gap-2 text-[11px]">
          {current.steps.map((st, i) => (
            <div 
              key={i} 
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                st.done ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${st.done ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className="font-medium truncate">{st.label}</span>
            </div>
          ))}
        </div>}

      </div>
    </div>
  );
}
