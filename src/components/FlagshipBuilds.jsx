import React, { useEffect, useState } from 'react';
import { formatINR } from '../utils/format';
import { ShoppingBag, Settings2 } from 'lucide-react';

export default function FlagshipBuilds({ onAddToCart, onCustomizePreset }) {
  const [components, setComponents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/components')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load database inventory');
        return response.json();
      })
      .then(setComponents)
      .catch(loadError => setError(loadError.message));
  }, []);

  return (
    <section id="flagships" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Database Inventory</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Available Components</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">Live component records, pricing, and stock availability from the BuildFlow database.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && components.length === 0 && <p className="text-sm text-slate-500">Loading inventory...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.slice(0, 6).map(component => (
            <div key={component._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-6">
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{component.category}</span>
                  <span>{component.brand}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-3">{component.name}</h3>
                <p className="text-xs text-slate-500 mt-2">
                  {Object.entries(component.specifications || {}).filter(([, value]) => value !== '' && (!Array.isArray(value) || value.length)).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')}
                </p>
                <p className="text-[11px] text-slate-400 mt-3">Available stock: {component.availableStock ?? component.stock}</p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="font-mono font-bold text-red-600">{formatINR(component.price)}</span>
                <div className="flex gap-2">
                  <button onClick={() => onAddToCart(component)} className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:text-red-600" title="Add to cart">
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                    <button onClick={() => onCustomizePreset()} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" /> Build
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
