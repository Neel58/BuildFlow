import React, { useEffect } from 'react';
import { CheckCircle, Truck, Package, ArrowRight, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function OrderSuccessPage({ onOpenTracking }) {
  const navigate = useNavigate();
  const { orderId } = useParams();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center border border-slate-100">
        
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Order Confirmed!</h2>
        <p className="text-slate-500 mb-6">
          Thank you for choosing BuildFlow. Your custom order has been securely processed and queued for assembly.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order Reference ID</div>
          <div className="font-mono text-lg font-semibold text-slate-900 bg-white border border-slate-200 py-2 rounded-lg shadow-sm">
            {orderId || 'BFL-XXXX-XXXX'}
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => {
              if (orderId) {
                onOpenTracking(orderId);
              } else {
                onOpenTracking();
              }
            }}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md font-bold transition-all flex items-center justify-center gap-2"
          >
            <Truck className="w-5 h-5" />
            Track Order Status
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5 text-slate-400" />
            Return to Store
          </button>
        </div>

      </div>
    </div>
  );
}
