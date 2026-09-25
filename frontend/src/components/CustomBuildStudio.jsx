import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertTriangle, ArrowLeft, RotateCcw, Share2, 
  Printer, ShoppingBag, Search, X, Check, Cpu, HardDrive, 
  Layers, Disc, Fan, Box, Zap
} from 'lucide-react';
import { formatINR } from '../utils/format';

export default function CustomBuildStudio({ onBackToHome, onAddToCart, presetToLoad }) {
  const [currentBuild, setCurrentBuild] = useState(null);
  const [componentCatalog, setComponentCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModalSlot, setActiveModalSlot] = useState(null); // 'CPU', 'Motherboard', etc.
  const [modalBrandFilter, setModalBrandFilter] = useState('ALL');
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    async function loadComponents() {
      try {
        const response = await fetch('/api/components');
        if (!response.ok) throw new Error('Unable to load builder components');
        const data = await response.json();
        const grouped = data.reduce((groups, component) => {
          const normalized = {
            ...component,
            id: String(component._id),
            specs: component.specifications || {}
          };
          (groups[normalized.category] ||= []).push(normalized);
          return groups;
        }, {});
        setComponentCatalog(grouped);
        setCurrentBuild({
          cpu: grouped.CPU?.[0],
          mobo: grouped.Motherboard?.[0],
          gpu: grouped.GPU?.[0],
          ram: grouped.RAM?.[0],
          ssd: grouped.SSD?.[0],
          psu: grouped.PSU?.[0],
          cabinet: grouped.Cabinet?.[0],
          cooler: grouped.Cooler?.[0]
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }
    loadComponents();
  }, []);

  const resetToDefault = () => {
    if (!componentCatalog) return;
    setCurrentBuild({
      cpu: componentCatalog.CPU?.[0],
      mobo: componentCatalog.Motherboard?.[0],
      gpu: componentCatalog.GPU?.[0],
      ram: componentCatalog.RAM?.[0],
      ssd: componentCatalog.SSD?.[0],
      psu: componentCatalog.PSU?.[0],
      cabinet: componentCatalog.Cabinet?.[0],
      cooler: componentCatalog.Cooler?.[0]
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading builder inventory from the database...</div>;
  if (error || !currentBuild) return <div className="min-h-screen flex items-center justify-center text-sm text-red-600">{error || 'Builder inventory is unavailable.'}</div>;

  // Calculations
  const subtotal = Object.values(currentBuild).reduce((sum, item) => sum + (item?.price || 0), 0);
  const cpuWatt = currentBuild.cpu?.specs?.powerDraw || 120;
  const gpuWatt = currentBuild.gpu?.specs?.powerDraw || 450;
  const totalPowerDraw = cpuWatt + gpuWatt + 90; // baseline fans/mobo/ram
  const psuWatt = currentBuild.psu?.specs?.wattage || 850;
  const psuHeadroom = psuWatt - totalPowerDraw;
  const psuLoadPct = Math.min(Math.round((totalPowerDraw / psuWatt) * 100), 100);

  // Compatibility Verification
  const cpuSocket = currentBuild.cpu?.specs?.socket;
  const moboSocket = currentBuild.mobo?.specs?.socket;
  const isSocketMatch = cpuSocket === moboSocket;

  const moboRamType = currentBuild.mobo?.specs?.ramType;
  const ramType = currentBuild.ram?.specs?.ramType;
  const isRamMatch = moboRamType === ramType;

  const gpuLength = currentBuild.gpu?.specs?.gpuLength || 336;
  const caseMaxGpu = currentBuild.cabinet?.specs?.maxGpuLength || 400;
  const isGpuFit = gpuLength <= caseMaxGpu;

  const coolerSockets = currentBuild.cooler?.specs?.coolerSocketSupport || ['AM5', 'LGA1700'];
  const isCoolerMatch = coolerSockets.includes(cpuSocket);

  const isPsuSufficient = psuHeadroom >= 100;

  const isAllCompatible = isSocketMatch && isRamMatch && isGpuFit && isCoolerMatch && isPsuSufficient;

  // Handle part selection from modal
  const handleSelectComponent = (comp, category) => {
    const slotKey = category.toLowerCase() === 'motherboard' ? 'mobo' : category.toLowerCase();
    setCurrentBuild(prev => ({
      ...prev,
      [slotKey]: { ...comp, category }
    }));
    setActiveModalSlot(null);
  };

  const slotIcons = {
    cpu: <Cpu className="w-5 h-5 text-red-600" />,
    mobo: <Layers className="w-5 h-5 text-indigo-600" />,
    gpu: <Zap className="w-5 h-5 text-emerald-600" />,
    ram: <Disc className="w-5 h-5 text-amber-600" />,
    ssd: <HardDrive className="w-5 h-5 text-cyan-600" />,
    psu: <Zap className="w-5 h-5 text-sky-600" />,
    cabinet: <Box className="w-5 h-5 text-purple-600" />,
    cooler: <Fan className="w-5 h-5 text-teal-600" />
  };

  const slotLabels = {
    cpu: 'Processor (CPU)',
    mobo: 'Motherboard',
    gpu: 'Graphics Card (GPU)',
    ram: 'System Memory (RAM)',
    ssd: 'Primary Storage (NVMe SSD)',
    psu: 'Power Supply Unit (PSU)',
    cabinet: 'Chassis / Cabinet Case',
    cooler: 'CPU Cooling Solution'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Studio Header Bar */}
      <section className="bg-white border-b border-slate-200 sticky top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Inventory:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button 
                onClick={resetToDefault}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Reset build"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Build (INR)</span>
              <span className="text-xl font-bold font-mono text-red-600 tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <button 
              onClick={() => onAddToCart({ type: 'customBuild', name: 'Custom Database Build', componentIds: Object.values(currentBuild).filter(Boolean).map(component => component._id) })}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>

        </div>
      </section>

      {/* Main Studio Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Title & Introduction */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            <span>Engineering Lab</span>
            <span>&middot;</span>
            <span>All Prices in Indian Rupees (₹)</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900">
            BuildFlow Custom PC Studio
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure each component with automated socket verification, physical clearance checks, and power headroom calculations. All rigs include precision clean-room assembly, 48-hour burn-in QA, and zero-cost insured shipping across India.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: 8 Hardware Slots */}
          <div className="lg:col-span-8 space-y-4">
            
            {Object.keys(slotLabels).map((slotKey) => {
              const item = currentBuild[slotKey];
              const category = slotKey === 'mobo' ? 'Motherboard' : 
                               slotKey === 'cabinet' ? 'Cabinet' : 
                               slotKey.toUpperCase();

              return (
                <div 
                  key={slotKey}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {slotIcons[slotKey]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {slotLabels[slotKey]}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {item?.brand || 'Unavailable'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {item?.name || 'No component available in database'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {Object.entries(item?.specs || {}).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                    <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                      {formatINR(item.price)}
                    </span>
                    <button 
                      onClick={() => {
                        setActiveModalSlot(category);
                        setModalBrandFilter('ALL');
                        setModalSearch('');
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Change Component
                    </button>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Right Column: Compatibility Verdict & Pricing Summary */}
          <div className="lg:col-span-4 sticky top-36 space-y-6">
            
            {/* Compatibility Verdict Box */}
            <div className={`p-5 rounded-2xl border ${isAllCompatible ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} space-y-4`}>
              <div className="flex items-center gap-2.5 font-bold text-sm">
                {isAllCompatible ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-900">All Hardware 100% Compatible</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-900">Hardware Conflict Detected</span>
                  </>
                )}
              </div>

              <ul className="text-xs space-y-2">
                <li className={`flex items-center gap-2 ${isSocketMatch ? 'text-emerald-800' : 'text-red-700 font-semibold'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>CPU Socket ({cpuSocket}) matches Motherboard ({moboSocket})</span>
                </li>
                <li className={`flex items-center gap-2 ${isRamMatch ? 'text-emerald-800' : 'text-red-700 font-semibold'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>DDR Generation ({ramType}) matched with motherboard</span>
                </li>
                <li className={`flex items-center gap-2 ${isGpuFit ? 'text-emerald-800' : 'text-red-700 font-semibold'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>GPU ({gpuLength}mm) fits chassis ({caseMaxGpu}mm clearance)</span>
                </li>
                <li className={`flex items-center gap-2 ${isCoolerMatch ? 'text-emerald-800' : 'text-red-700 font-semibold'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Cooler bracket verified for socket {cpuSocket}</span>
                </li>
                <li className={`flex items-center gap-2 ${isPsuSufficient ? 'text-emerald-800' : 'text-amber-700 font-semibold'}`}>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>PSU Headroom: +{psuHeadroom}W available on {psuWatt}W PSU</span>
                </li>
              </ul>
            </div>

            {/* Power & Wattage Gauge */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Estimated Peak System Load</span>
                <span className="font-mono text-red-600 font-bold">{totalPowerDraw}W / {psuWatt}W</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${psuLoadPct > 85 ? 'bg-amber-500' : 'bg-red-500'}`} 
                  style={{ width: `${psuLoadPct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Safe continuous load target: &lt;80%</span>
                <span className="font-bold text-slate-700">{psuLoadPct}% Load</span>
              </div>
            </div>

            {/* Price Breakdown in Indian Rupees */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-display text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Summary (INR)
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Components Total</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Clean-Room Assembly & Cable Routing</span>
                  <span className="text-emerald-600 font-semibold">Included (₹0)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>48-Hour Multi-Stress QA Benchmarking</span>
                  <span className="text-emerald-600 font-semibold">Included (₹0)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Expanding-Foam Insured Logistics</span>
                  <span className="text-emerald-600 font-semibold">Included (₹0)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-3">
                  <span>Grand Total (INR)</span>
                  <span className="font-mono tabular-nums text-red-600 text-lg">{formatINR(subtotal)}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <button 
                  onClick={() => onAddToCart({ type: 'customBuild', name: 'Custom Database Build', componentIds: Object.values(currentBuild).filter(Boolean).map(component => component._id) })}
                  className="w-full py-3.5 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm shadow-red-600/25 transition-all text-center cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Rig to Cart</span>
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const summary = `BuildFlow Custom PC Rig:\n- CPU: ${currentBuild.cpu.name}\n- Board: ${currentBuild.mobo.name}\n- GPU: ${currentBuild.gpu.name}\n- RAM: ${currentBuild.ram.name}\n- SSD: ${currentBuild.ssd.name}\n- PSU: ${currentBuild.psu.name}\n- Case: ${currentBuild.cabinet.name}\n- Cooler: ${currentBuild.cooler.name}\nTotal: ${formatINR(subtotal)}`;
                      navigator.clipboard.writeText(summary);
                      alert('📋 Spec sheet copied to clipboard!');
                    }}
                    className="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Specs</span>
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Spec Sheet</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Backed by 3-Year Zero-Downtime Lab Warranty
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* COMPONENT SELECTION MODAL */}
      {activeModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Hardware Catalog</span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Select {activeModalSlot}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModalSlot(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Brand Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input 
                  type="text"
                  placeholder={`Search ${activeModalSlot} by model or specs...`}
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Brands Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {['ALL', ...new Set((componentCatalog[activeModalSlot] || []).map(i => i.brand))].map(brand => (
                  <button
                    key={brand}
                    onClick={() => setModalBrandFilter(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      modalBrandFilter === brand ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {brand === 'ALL' ? 'All Brands' : brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Components List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {(componentCatalog[activeModalSlot] || [])
                .filter(item => {
                  const matchesBrand = modalBrandFilter === 'ALL' || item.brand === modalBrandFilter;
                  const matchesSearch = item.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
                                        JSON.stringify(item.specs).toLowerCase().includes(modalSearch.toLowerCase());
                  return matchesBrand && matchesSearch;
                })
                .map(comp => {
                  const slotKey = activeModalSlot.toLowerCase() === 'motherboard' ? 'mobo' : activeModalSlot.toLowerCase();
                  const isCurrent = currentBuild[slotKey]?.id === comp.id;

                  return (
                    <div 
                      key={comp.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent ? 'border-red-500 bg-red-50/40 ring-1 ring-red-500' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{comp.brand}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              Current Selection
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{comp.name}</h4>
                        <p className="text-xs text-slate-500">
                          {Object.entries(comp.specs || {}).map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1')}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}
                        </p>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                          {formatINR(comp.price)}
                        </span>
                        <button 
                          onClick={() => handleSelectComponent(comp, activeModalSlot)}
                          disabled={isCurrent}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            isCurrent ? 'bg-slate-200 text-slate-500 cursor-default' : 'bg-red-600 text-white hover:bg-red-700 shadow-xs'
                          }`}
                        >
                          {isCurrent ? 'Selected' : 'Choose Part'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
