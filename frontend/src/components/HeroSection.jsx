import React, { useState } from 'react';
import { ArrowRight, Cpu, CheckCircle2, ShieldCheck, Award, Zap, Truck, ShoppingBag, Settings2 } from 'lucide-react';
import { formatINR } from '../utils/format';
import heroImg from '../assets/images/hero_pc_buildflow_light_1790308280046.jpg';

const WORKSTATION_PRESETS = {
  workstation: {
    id: 'workstation',
    name: 'AI & 3D Render Studio Pro',
    tag: 'Flagship Multi-Core',
    price: 379999,
    cpu: '14900k',
    gpu: 'rtx4090',
    ram: '64GB DDR5 6000MHz',
    storage: '1TB PCIe 5.0 Crucial T700',
    description: 'Extreme compute platform designed for LLM training, 3D rendering, and VFX studios.'
  },
  apex4k: {
    id: 'apex4k',
    name: 'Apex 4K Gaming Flagship',
    tag: 'Enthusiast 4K Rig',
    price: 279999,
    cpu: '7800x3d',
    gpu: 'rtx4090',
    ram: '32GB DDR5 6000MHz',
    storage: '2TB Samsung 990 PRO Gen4',
    description: 'Liquid-cooled enthusiast powerhouse tuned for 4K 144Hz ultra gaming and Unreal Engine 5.'
  },
  competitor: {
    id: 'competitor',
    name: 'Competitive Esports Battlestation',
    tag: 'Esports Tier-1',
    price: 119999,
    cpu: '7600x',
    gpu: 'rtx4070tis',
    ram: '32GB DDR5 5600MHz',
    storage: '1TB Kingston NV2 Gen4',
    description: 'Ultra-low-latency 1080p/1440p battlestation for high refresh rate competitive esports.'
  },
  deeplearning: {
    id: 'workstation',
    name: 'Dual-GPU Deep Learning Rig',
    tag: 'Dual-GPU Compute',
    price: 412000,
    cpu: '14900k',
    gpu: 'rtx4090',
    ram: '128GB DDR5 6000MHz',
    storage: '2TB PCIe 5.0 + 4TB NVMe',
    description: 'Dual RTX 4090 orientation with dedicated PCIe bracket for machine learning.'
  }
};

export default function HeroSection({ onStartCustomBuild, onCustomizePreset, onAddToCart }) {
  const [selectedPresetKey, setSelectedPresetKey] = useState('workstation');
  const [selectedCpu, setSelectedCpu] = useState('14900k');
  const [selectedGpu, setSelectedGpu] = useState('rtx4090');

  const cpuData = {
    '7800x3d': { name: 'AMD Ryzen 7 7800X3D', socket: 'AM5', watt: 120 },
    '14900k': { name: 'Intel Core i9-14900K', socket: 'LGA1700', watt: 253 },
    '7600x': { name: 'AMD Ryzen 5 7600X', socket: 'AM5', watt: 105 }
  };

  const gpuData = {
    'rtx4090': { name: 'NVIDIA RTX 4090 24GB', watt: 450 },
    'rtx4080s': { name: 'NVIDIA RTX 4080 SUPER 16GB', watt: 320 },
    'rtx4070tis': { name: 'NVIDIA RTX 4070 Ti SUPER 16GB', watt: 285 }
  };

  const handleWorkstationChange = (key) => {
    setSelectedPresetKey(key);
    const preset = WORKSTATION_PRESETS[key];
    if (preset) {
      if (preset.cpu) setSelectedCpu(preset.cpu);
      if (preset.gpu) setSelectedGpu(preset.gpu);
    }
  };

  const activeWorkstation = WORKSTATION_PRESETS[selectedPresetKey] || WORKSTATION_PRESETS.workstation;
  const currentCpu = cpuData[selectedCpu] || cpuData['14900k'];
  const currentGpu = gpuData[selectedGpu] || gpuData['rtx4090'];
  const estWatt = currentCpu.watt + currentGpu.watt + 80;

  return (
    <section id="hero" className="relative min-h-[640px] lg:min-h-[720px] flex flex-col justify-between overflow-hidden bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImg} 
          alt="Modern High-Tech Custom PC Building Lab" 
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1920&q=80';
          }}
        />
        {/* Measured Scrim Overlay */}
        <div className="absolute inset-0 hero-scrim"></div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column */}
        <div className="lg:col-span-7 text-white space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
            <span>Engineered Hardware</span>
            <span aria-hidden="true">&middot;</span>
            <span>Zero-Bottleneck Guarantee</span>
            <span aria-hidden="true">&middot;</span>
            <span>ISO 9001 Lab</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] max-w-2xl text-balance">
            WE BUILD YOUR DREAM RIG TO PERFECTION
          </h1>

          <p className="text-base sm:text-lg text-slate-200/90 font-normal leading-relaxed max-w-xl">
            From liquid-cooled competitive battlestations to multi-GPU AI workstations, BuildFlow delivers real-time hardware compatibility, clean-room assembly, multi-hour stress QA, and insured express delivery across India.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button 
              onClick={onStartCustomBuild}
              className="inline-flex items-center gap-3 px-6 py-3.5 text-base font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Start Custom Build</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#flagships" 
              className="inline-flex items-center gap-2 px-5 py-3.5 text-base font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Cpu className="w-4 h-4" />
              <span>Explore Workstations</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="pt-4 flex items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3-Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Certified Stress-Tested</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Shock-Insulated Transit</span>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Quick Configurator & Workstation Selector Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100/90 p-6 sm:p-7 space-y-4 text-slate-800 animate-in fade-in zoom-in-95 duration-300">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Home Precision Lab</span>
                <h3 className="font-display text-lg font-bold text-slate-900">Workstation Quick Selector</h3>
              </div>
              <span className="text-[11px] font-mono font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-100">
                {formatINR(activeWorkstation.price)}
              </span>
            </div>

            <div className="space-y-3">
              
              {/* Select Workstation Preset */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Pre-Engineered Workstation</label>
                  <span className="text-[10px] text-slate-500 font-mono">1-Click Switch</span>
                </div>
                <select 
                  value={selectedPresetKey}
                  onChange={(e) => handleWorkstationChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shadow-xs"
                >
                  <option value="workstation">AI & 3D Render Studio Pro (₹3,79,999)</option>
                  <option value="apex4k">Apex 4K Gaming Flagship (₹2,79,999)</option>
                  <option value="competitor">Competitive Esports Battlestation (₹1,19,999)</option>
                  <option value="deeplearning">Dual-GPU Deep Learning Rig (₹4,12,000)</option>
                </select>
              </div>

              {/* Processor Component */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Processor (CPU)</label>
                <select 
                  value={selectedCpu}
                  onChange={(e) => setSelectedCpu(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="14900k">Intel Core i9-14900K (LGA1700 · 253W)</option>
                  <option value="7800x3d">AMD Ryzen 7 7800X3D (AM5 · 120W)</option>
                  <option value="7600x">AMD Ryzen 5 7600X (AM5 · 105W)</option>
                </select>
              </div>

              {/* Graphics Component */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Graphics Card (GPU)</label>
                <select 
                  value={selectedGpu}
                  onChange={(e) => setSelectedGpu(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="rtx4090">NVIDIA GeForce RTX 4090 24GB (450W)</option>
                  <option value="rtx4080s">NVIDIA GeForce RTX 4080 SUPER 16GB (320W)</option>
                  <option value="rtx4070tis">NVIDIA GeForce RTX 4070 Ti SUPER 16GB (285W)</option>
                </select>
              </div>

              {/* Specs & Compatibility Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Configured Rig:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{activeWorkstation.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-semibold text-slate-500">Memory & Storage:</span>
                  <span className="text-slate-800 font-mono text-[11px] truncate max-w-[200px]">{activeWorkstation.ram}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentCpu.socket} Socket &middot; 100% Fit</span>
                  </span>
                  <span className="font-mono">~{estWatt}W TDP</span>
                </div>
              </div>

              {/* Dual Action Buttons: Customize in Studio & Quick Add to Cart */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => {
                    if (onCustomizePreset) onCustomizePreset(activeWorkstation.id);
                    else onStartCustomBuild();
                  }}
                  className="py-2.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Open this workstation in the 8-slot custom studio"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Customize</span>
                </button>

                <button 
                  onClick={() => {
                    if (onAddToCart) {
                      onAddToCart({
                        type: 'customBuild',
                        name: activeWorkstation.name,
                        price: activeWorkstation.price,
                        componentIds: []
                      });
                    }
                  }}
                  className="py-2.5 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/20"
                  title="Add this workstation configuration to your cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* HERO BOTTOM STATS BAR */}
      <div className="relative z-10 glass-bar border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-white divide-y md:divide-y-0 md:divide-x divide-white/10">
          
          <div className="pt-3 md:pt-0 md:px-6 first:pl-0">
            <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">5,000+</div>
            <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-0.5">Satisfied Clients & Custom Rigs</p>
          </div>

          <div className="pt-3 md:pt-0 md:px-6">
            <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">0.02%</div>
            <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-0.5">First-Year RMA Failure Rate</p>
          </div>

          <div className="pt-3 md:pt-0 md:px-6">
            <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">48 Hours</div>
            <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-0.5">Continuous Thermal Stress QA</p>
          </div>

          <div className="pt-3 md:pt-0 md:px-6">
            <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">100%</div>
            <p className="text-xs sm:text-sm text-slate-300/80 font-normal mt-0.5">Pan-India Insured Express</p>
          </div>

        </div>
      </div>
    </section>
  );
}
