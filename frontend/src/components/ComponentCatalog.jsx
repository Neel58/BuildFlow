import React, { useState, useEffect } from 'react';
import { formatINR } from '../utils/format';
import { Search, ShoppingBag, Layers } from 'lucide-react';

export default function ComponentCatalog({ onAddToCart, onConfigureInStudio }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchComponents() {
      try {
        setLoading(true);
        const res = await fetch('/api/components');
        if (!res.ok) throw new Error('Unable to load components');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid component response');
        setComponents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchComponents();
  }, []);

  const displayList = components.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          JSON.stringify(item.specifications).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['ALL', 'CPU', 'Motherboard', 'GPU', 'RAM', 'SSD', 'PSU', 'Cabinet', 'Cooler'];

  return (
    <section id="catalog" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              <span>Verified Components</span>
              <span>&middot;</span>
              <span>Zero-Counterfeit Supply</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Hardware Component Inventory
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Tier-1 certified processors, graphics cards, DDR5 modules, and PCIe 5.0 solid-state drives with direct factory warranty.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text"
              placeholder="Search components or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 border-b border-slate-100 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Components' : cat}
            </button>
          ))}
        </div>

        {loading && <p className="py-12 text-center text-sm text-slate-500">Loading inventory from the database...</p>}
        {error && <p className="py-12 text-center text-sm text-red-600">{error}</p>}
        {!loading && !error && displayList.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">No components match your search.</p>
        )}

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayList.map((item) => (
            <div 
              key={item.id}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <span>{item.category}</span>
                  <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.brand}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1">
                  {item.name}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                  {Object.entries(item.specifications || {})
                    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${Array.isArray(v) ? v.join(', ') : v}`)
                    .join(' · ')}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">Available stock: {item.availableStock ?? item.stock ?? 0}</p>
              </div>

              <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center justify-between gap-4">
                <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatINR(item.price)}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => onAddToCart(item)}
                    className="p-2 bg-white hover:bg-red-50 hover:text-red-600 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Add to cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={onConfigureInStudio}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Build With This
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
