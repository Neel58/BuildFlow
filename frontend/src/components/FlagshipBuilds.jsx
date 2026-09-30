import React, { useEffect, useState } from 'react';
import { formatINR } from '../utils/format';
import { ShoppingBag, Settings2, Zap, Cpu, Award, ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { presets, componentCatalog as fallbackCatalog } from '../data/initialData';

export default function FlagshipBuilds({ onAddToCart, onCustomizePreset }) {
  const [components, setComponents] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL'); // ALL, WORKSTATION, GAMING, ESPORTS
  const [error, setError] = useState('');

  const flagshipList = [
    {
      key: 'workstation',
      category: 'WORKSTATION',
      title: presets.workstation.name,
      badge: 'Multi-Core Workstation',
      tagline: 'Extreme compute platform designed for LLM training, 3D rendering, and VFX studios.',
      price: presets.workstation.price,
      specs: [
        { label: 'CPU', val: 'Intel Core i9-14900K (24C/32T, 6.0 GHz)' },
        { label: 'GPU', val: 'NVIDIA GeForce RTX 4090 24GB GDDR6X' },
        { label: 'RAM', val: '64GB G.Skill Trident Z5 RGB DDR5' },
        { label: 'SSD', val: '1TB Crucial T700 PCIe 5.0 NVMe' },
        { label: 'Cooler', val: 'NZXT Kraken Elite 360mm LCD Liquid' },
        { label: 'PSU', val: 'Corsair RM1000x 1000W Shift ATX 3.0' }
      ]
    },
    {
      key: 'apex4k',
      category: 'GAMING',
      title: presets.apex4k.name,
      badge: 'Flagship 4K Rig',
      tagline: 'Liquid-cooled enthusiast powerhouse tuned for 4K 144Hz ultra gaming and Unreal Engine 5.',
      price: presets.apex4k.price,
      specs: [
        { label: 'CPU', val: 'AMD Ryzen 7 7800X3D (8C/16T, 5.0 GHz)' },
        { label: 'GPU', val: 'NVIDIA GeForce RTX 4090 24GB GDDR6X' },
        { label: 'RAM', val: '32GB Corsair Vengeance DDR5 6000MHz' },
        { label: 'SSD', val: '2TB Samsung 990 PRO Gen4 NVMe' },
        { label: 'Cooler', val: 'DeepCool AK620 Digital Twin Tower' },
        { label: 'PSU', val: 'Corsair RM850x 850W Gold Modular' }
      ]
    },
    {
      key: 'competitor',
      category: 'ESPORTS',
      title: presets.competitor.name,
      badge: 'Esports Tier-1',
      tagline: 'Ultra-low-latency 1080p/1440p battlestation for high refresh rate competitive esports.',
      price: presets.competitor.price,
      specs: [
        { label: 'CPU', val: 'AMD Ryzen 5 7600X (6C/12T, 5.3 GHz)' },
        { label: 'GPU', val: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB' },
        { label: 'RAM', val: '32GB Corsair Vengeance DDR5 6000MHz' },
        { label: 'SSD', val: '1TB Kingston NV2 PCIe 4.0 NVMe' },
        { label: 'Cooler', val: 'DeepCool AK620 Digital Cooler' },
        { label: 'PSU', val: 'Seasonic Focus GX-750 750W Gold' }
      ]
    },
    {
      key: 'workstation', // loads workstation with high specs
      category: 'WORKSTATION',
      title: 'Dual-GPU Deep Learning Rig',
      badge: 'Dual-GPU Compute',
      tagline: 'Industrial workstation with dual RTX 4090 PCIe topology for local LLM inference and batch rendering.',
      price: 412000,
      specs: [
        { label: 'CPU', val: 'Intel Core i9-14900K (24C/32T, 6.0 GHz)' },
        { label: 'GPU', val: 'Dual NVIDIA RTX 4090 24GB (48GB VRAM)' },
        { label: 'RAM', val: '128GB Corsair DDR5 5600MHz ECC' },
        { label: 'SSD', val: '2TB Crucial T700 PCIe 5.0 + 4TB NVMe' },
        { label: 'Cooler', val: 'Corsair iCUE LINK 360mm AIO' },
        { label: 'PSU', val: 'Corsair HX1200 1200W Platinum' }
      ]
    }
  ];

  const filteredRigs = flagshipList.filter(rig => 
    activeCategory === 'ALL' || rig.category === activeCategory
  );

  useEffect(() => {
    fetch('/api/components')
      .then(response => {
        if (!response.ok) throw new Error('Unable to load database inventory');
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setComponents(data);
        } else {
          fallbackLocal();
        }
      })
      .catch(() => fallbackLocal());

    function fallbackLocal() {
      const all = Object.entries(fallbackCatalog).flatMap(([cat, items]) =>
        items.map(i => ({ ...i, _id: i.id, category: cat, specifications: i.specs || {} }))
      );
      setComponents(all);
    }
  }, []);

  return (
    <section id="flagships" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flagship Rigs Header & Category Filter Tabs */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              <span>Engineered Hardware</span>
              <span>&middot;</span>
              <span>Tested & Calibrated</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Turnkey Workstations & Gaming Rigs
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Turnkey systems assembled in ISO-certified cleanrooms, bench-tested with 48-hour synthetic stress workloads.
            </p>
          </div>

          {/* Workstation / Rig Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            {[
              { id: 'ALL', label: 'All Systems' },
              { id: 'WORKSTATION', label: 'Workstations & AI' },
              { id: 'GAMING', label: '4K Gaming' },
              { id: 'ESPORTS', label: 'Esports Tier-1' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flagship Pre-configured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {filteredRigs.map((rig, idx) => (
            <div 
              key={rig.key ? `${rig.key}-${idx}` : `rig-${idx}`}
              className="bg-white rounded-2xl border border-slate-200 hover:border-red-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100">
                    {rig.badge}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>3-Yr Warranty</span>
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                  {rig.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                  {rig.tagline}
                </p>

                {/* Specs List */}
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                  {rig.specs.map((spec, specIdx) => (
                    <div key={`${spec.label}-${specIdx}`} className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-400 w-14 shrink-0 text-[11px]">{spec.label}</span>
                      <span className="text-slate-800 text-right font-medium truncate ml-2 text-[11px]">{spec.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Price (INR)</span>
                  <span className="font-mono text-lg font-bold text-red-600 tabular-nums">{formatINR(rig.price)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => onCustomizePreset && onCustomizePreset(rig.key)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    title="Customize this workstation in 8-slot studio"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span>Customize</span>
                  </button>
                  <button 
                    onClick={() => onAddToCart({ 
                      type: 'customBuild', 
                      name: rig.title, 
                      price: rig.price,
                      componentIds: [] 
                    })}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs shadow-red-600/20"
                    title="Add to cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Featured Components Grid */}
        <div className="pt-6 border-t border-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">Featured Database Inventory</h3>
              <p className="text-xs text-slate-500 mt-0.5">High-demand components ready for immediate dispatch or custom studio configuration.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.slice(0, 6).map((component, compIdx) => (
              <div key={component._id || component.id || `featured-${compIdx}`} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-5 hover:shadow-md transition-shadow">
                <div>
                  <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="text-red-600 font-semibold">{component.category}</span>
                    <span>{component.brand}</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-slate-900 mt-2">{component.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {Object.entries(component.specifications || {}).filter(([, value]) => value !== '' && (!Array.isArray(value) || value.length)).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Available stock: {component.availableStock ?? component.stock ?? 25} units
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span className="font-mono font-bold text-slate-900">{formatINR(component.price)}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onAddToCart(component)} 
                      className="p-2 border border-slate-200 hover:border-red-500 hover:text-red-600 rounded-lg text-slate-700 transition-colors cursor-pointer" 
                      title="Add to cart"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onCustomizePreset && onCustomizePreset('workstation')} 
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
