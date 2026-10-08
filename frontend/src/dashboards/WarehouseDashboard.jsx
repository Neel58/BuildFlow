import React, { useState, useEffect } from 'react';
import { 
  Archive, Package, AlertTriangle, Search, Filter, Plus, 
  ArrowRight, CheckCircle2, RotateCcw, Download, Printer, 
  Layers, ShoppingBag, ShieldCheck, Cpu, HardDrive, BarChart3, 
  Clock, X, Check, RefreshCw, FileText, ChevronDown, LogOut,
  MapPin, Sliders, Hash, ArrowUpRight, Box, Tag, AlertCircle, Scale
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { apiRequest, clearSession } from '../utils/api';

const CATEGORIES = ['ALL', 'CPU', 'Motherboard', 'GPU', 'RAM', 'SSD', 'PSU', 'Cabinet', 'Cooler'];

const SUPPLIERS = [
  'Supertron Electronics Pvt Ltd',
  'Rashi Peripherals Ltd',
  'Kaizen Infoserve (Corsair/AMD India)',
  'Redington India Limited',
  'Ingram Micro Hardware'
];

export default function WarehouseDashboard({ user, onLogout, onBackToStore }) {
  // Navigation & Sub-Tabs
  const [activeTab, setActiveTab] = useState('catalog'); // catalog, intake, pick_lists, low_stock
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Core Data States
  const [components, setComponents] = useState([]);
  const [pickLists, setPickLists] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState('ALL'); // ALL, LOW, CRITICAL, IN_STOCK

  // Modals
  const [adjustModal, setAdjustModal] = useState(null); // component to adjust
  const [intakeModal, setIntakeModal] = useState(null); // component for inbound PO intake
  const [createSkuModal, setCreateSkuModal] = useState(false); // add new component SKU
  const [binInspectModal, setBinInspectModal] = useState(null); // inspect bin & barcode

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Inventory Data
  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/components').catch(() => []);
      if (Array.isArray(res) && res.length > 0) {
        setComponents(res);
      } else {
        const invRes = await apiRequest('/api/inventory').catch(() => null);
        if (invRes && Array.isArray(invRes.components)) {
          setComponents(invRes.components);
        }
      }

      // Load Cleanroom Pick Lists
      const picks = await apiRequest('/api/inventory/picks').catch(() => []);
      if (Array.isArray(picks) && picks.length > 0) {
        setPickLists(picks);
      }
    } catch (err) {
      console.warn('Inventory loading error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // --- Handlers: Stock Adjustment ---
  const handleAdjustStock = async (componentId, adjustmentAmount, newExactStock, reason) => {
    try {
      await apiRequest(`/api/inventory/${componentId}/adjust`, {
        method: 'PUT',
        body: JSON.stringify({
          stockAdjustment: adjustmentAmount !== undefined ? Number(adjustmentAmount) : undefined,
          newStock: newExactStock !== undefined ? Number(newExactStock) : undefined,
          reason
        })
      });
      showToast(`Stock updated for SKU: ${adjustModal?.name}`);
      setAdjustModal(null);
      loadInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Inbound PO Intake (Goods Receipt Note) ---
  const handleInboundIntake = async (componentId, quantity, poNumber, supplier, invoiceNumber, binLocation) => {
    try {
      await apiRequest('/api/inventory/intake', {
        method: 'POST',
        body: JSON.stringify({
          componentId,
          quantity: Number(quantity),
          poNumber,
          supplier,
          invoiceNumber,
          binLocation
        })
      });
      showToast(`Received ${quantity} units on PO #${poNumber}. Stored in Bin ${binLocation}.`);
      setIntakeModal(null);
      loadInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Create Component SKU ---
  const handleCreateSku = async (newCompData) => {
    try {
      await apiRequest('/api/components', {
        method: 'POST',
        body: JSON.stringify(newCompData)
      });
      showToast(`SKU ${newCompData.name} registered in warehouse database.`);
      setCreateSkuModal(false);
      loadInventory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Pick Item for Cleanroom ---
  const handlePickItem = async (orderId, slot, itemName) => {
    try {
      await apiRequest('/api/inventory/pick-item', {
        method: 'POST',
        body: JSON.stringify({ orderId, slot })
      });
      showToast(`Picked & scanned [${slot}] ${itemName} for Order #${orderId}`);
      // Update local pickLists state
      setPickLists(prev => prev.map(p => {
        if (p.orderId === orderId) {
          return {
            ...p,
            items: p.items.map(it => it.slot === slot ? { ...it, picked: true } : it)
          };
        }
        return p;
      }));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleExportLedger = async (format = 'csv') => {
    try {
      showToast(`Downloading Warehouse Inventory Ledger (${format.toUpperCase()})...`);
      const res = await apiRequest(`/api/reports/export?type=inventory&format=${format}`);
      const blob = new Blob([res], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_ledger.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Failed to download report', 'error');
    }
  };

  // Warehouse Calculations
  const totalValuation = components.reduce((sum, c) => sum + (c.price * (c.stock || 0)), 0);
  const totalPhysicalUnits = components.reduce((sum, c) => sum + (c.stock || 0), 0);
  const totalReservedUnits = components.reduce((sum, c) => sum + (c.reservedStock || 0), 0);
  const totalAvailableUnits = totalPhysicalUnits - totalReservedUnits;
  const lowStockCount = components.filter(c => (c.availableStock ?? c.stock ?? 0) < 15).length;
  const criticalStockCount = components.filter(c => (c.availableStock ?? c.stock ?? 0) < 8).length;

  // Filtered Components List
  const filteredComponents = components.filter(comp => {
    const matchesCategory = selectedCategory === 'ALL' || comp.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      comp.name.toLowerCase().includes(query) ||
      comp.brand.toLowerCase().includes(query) ||
      (comp.binLocation || '').toLowerCase().includes(query) ||
      comp.category.toLowerCase().includes(query);

    const available = comp.availableStock ?? comp.stock ?? 0;
    let matchesStockLevel = true;
    if (stockLevelFilter === 'LOW') matchesStockLevel = available < 15;
    if (stockLevelFilter === 'CRITICAL') matchesStockLevel = available < 8;
    if (stockLevelFilter === 'IN_STOCK') matchesStockLevel = available >= 15;

    return matchesCategory && matchesSearch && matchesStockLevel;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-red-600 selection:text-white antialiased">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-900 border-slate-800 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP WAREHOUSE TERMINAL HEADER */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between shadow-xs">
        
        {/* Brand & Terminal Identifier */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-sm text-white">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-slate-950 tracking-tight">BuildFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                Warehouse & Inventory Depot
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="font-mono">Bengaluru Central Hub · Bay 1 Storage Matrix</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                RFID Bin Tracking Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Global Warehouse Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setCreateSkuModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hardware SKU</span>
          </button>

          <button 
            onClick={() => handleExportLedger('csv')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Valuation CSV</span>
          </button>

          {onBackToStore && (
            <button 
              onClick={onBackToStore}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Storefront &rarr;
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 mx-1"></div>

          {/* User profile & logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 leading-tight">David Miller</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold">WAREHOUSE_LEAD</span>
            </div>
            <button 
              onClick={() => { clearSession(); onLogout(); }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </header>

      {/* SUB-HEADER / TAB NAVIGATION */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'catalog', label: 'Hardware Stock Matrix', icon: Layers, count: components.length },
            { id: 'pick_lists', label: 'Cleanroom Pick Lists', icon: Package, count: pickLists.length },
            { id: 'low_stock', label: 'Low Stock & Reorders', icon: AlertTriangle, count: lowStockCount },
            { id: 'intake', label: 'Inbound PO Intake & GRN', icon: ArrowUpRight, count: null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* KPI SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Warehouse Valuation</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {formatINR(totalValuation || 8490000)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {components.length} Registered Active Hardware SKUs
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Physical Units On Hand</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Box className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-blue-600 tabular-nums">
              {totalPhysicalUnits} Units
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              {totalAvailableUnits} Available &middot; {totalReservedUnits} Reserved in Bays
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Cleanroom Assembly Picks</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
              {pickLists.length} Builds
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Components staging for ESD cleanroom bays
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Threshold</span>
              <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-red-600 tabular-nums">
              {lowStockCount} SKUs
            </div>
            <span className="text-[11px] text-red-700 font-semibold block mt-1">
              {criticalStockCount} Critical (&lt; 8 units) &middot; Reorder Advised
            </span>
          </div>

        </div>

        {/* TAB 1: HARDWARE STOCK MATRIX */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            
            {/* Filter & Search Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SKU name, brand, bin (A-02), socket..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Category Pills & Filters */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {CATEGORIES.slice(0, 6).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {CATEGORIES.length > 6 && (
                    <select
                      value={CATEGORIES.slice(6).includes(selectedCategory) ? selectedCategory : 'MORE'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-600 px-2 py-1 rounded cursor-pointer focus:outline-none"
                    >
                      <option value="MORE" disabled>More...</option>
                      {CATEGORIES.slice(6).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Stock Level Filter */}
                <select
                  value={stockLevelFilter}
                  onChange={(e) => setStockLevelFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="LOW">Low Stock (&lt;15)</option>
                  <option value="CRITICAL">Critical (&lt;8)</option>
                  <option value="IN_STOCK">Healthy Stock (15+)</option>
                </select>

                <button 
                  onClick={loadInventory}
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white"
                  title="Refresh Inventory"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Component SKU & Bin</th>
                      <th className="py-3.5 px-4">Category & Brand</th>
                      <th className="py-3.5 px-4">Unit Valuation</th>
                      <th className="py-3.5 px-4">Physical Stock</th>
                      <th className="py-3.5 px-4">Reserved (Bays)</th>
                      <th className="py-3.5 px-4">Net Available</th>
                      <th className="py-3.5 px-4">Health Status</th>
                      <th className="py-3.5 px-4 text-right">Warehouse Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredComponents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400">
                          No matching components found in warehouse inventory.
                        </td>
                      </tr>
                    ) : (
                      filteredComponents.map(comp => {
                        const available = comp.availableStock ?? (comp.stock - (comp.reservedStock || 0));
                        const isCritical = available < 8;
                        const isLow = available < 15;
                        const bin = comp.binLocation || `Rack ${comp.category[0] || 'A'}-0${(comp.name.length % 5) + 1}`;

                        return (
                          <tr key={comp._id || comp.id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Component Name & Bin Location */}
                            <td className="py-3.5 px-4 max-w-[240px]">
                              <span className="font-bold text-slate-900 block truncate">{comp.name}</span>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                                <MapPin className="w-3 h-3 text-amber-500" />
                                <span className="font-bold text-slate-700">Bin {bin}</span>
                                <span>&middot;</span>
                                <span className="text-slate-400 font-mono text-[10px]">{comp._id || comp.id}</span>
                              </div>
                            </td>

                            {/* Category & Brand */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {comp.category}
                              </span>
                              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                                {comp.brand}
                              </span>
                            </td>

                            {/* Unit Valuation */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                              {formatINR(comp.price)}
                              <span className="text-[10px] text-slate-400 block font-normal">
                                Total: {formatINR(comp.price * (comp.stock || 0))}
                              </span>
                            </td>

                            {/* Physical Stock */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm tabular-nums">
                              {comp.stock || 0}
                            </td>

                            {/* Reserved Stock */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-amber-600 tabular-nums">
                              {comp.reservedStock || 0}
                            </td>

                            {/* Net Available */}
                            <td className="py-3.5 px-4 font-mono font-bold text-sm tabular-nums">
                              <span className={isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}>
                                {available}
                              </span>
                            </td>

                            {/* Health Status */}
                            <td className="py-3.5 px-4">
                              {isCritical ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  CRITICAL ({available})
                                </span>
                              ) : isLow ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  LOW STOCK
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  HEALTHY
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* Action 1: Stock Adjustment */}
                                <button
                                  onClick={() => setAdjustModal(comp)}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                                  title="Adjust physical stock & cycle count"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>Adjust</span>
                                </button>

                                {/* Action 2: PO Intake */}
                                <button
                                  onClick={() => setIntakeModal(comp)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Receive inbound distributor PO"
                                >
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>Receive</span>
                                </button>

                                {/* Action 3: Bin Barcode Inspect */}
                                <button
                                  onClick={() => setBinInspectModal(comp)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="Inspect Bin Location & Barcode"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CLEANROOM ASSEMBLY PICK LISTS */}
        {activeTab === 'pick_lists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Active Assembly Pick Lists</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick hardware components from warehouse racks and verify serials for cleanroom assembly bays.
                </p>
              </div>
              <button 
                onClick={loadInventory}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Picks</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pickLists.map((pickOrder) => {
                const totalItems = pickOrder.items?.length || 8;
                const pickedCount = pickOrder.items?.filter(i => i.picked).length || 0;
                const progressPct = Math.round((pickedCount / totalItems) * 100);

                return (
                  <div key={pickOrder.orderId} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                    
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-base">{pickOrder.orderId}</span>
                          <span className="text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            {pickOrder.bayNumber}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{pickOrder.rigName} &middot; {pickOrder.customer}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900">{pickedCount}/{totalItems} Picked</span>
                        <div className="w-24 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Pick Items List */}
                    <div className="space-y-2">
                      {pickOrder.items?.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                            item.picked 
                              ? 'bg-slate-50/70 border-slate-200/80 text-slate-500' 
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700 w-24 shrink-0 text-[11px] font-mono">[{item.slot}]</span>
                            <div>
                              <span className={`font-semibold ${item.picked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.name}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Bin {item.bin}
                                </span>
                                <span>&middot;</span>
                                <span>{item.serial}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {item.picked ? (
                              <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePickItem(pickOrder.orderId, item.slot, item.name)}
                                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Scan & Pick</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LOW STOCK & CRITICAL REORDERS */}
        {activeTab === 'low_stock' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Critical Stock Depletion Center</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Components with available quantities below safety threshold (&lt; 15 units). Prioritize PO generation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {components
                .filter(c => (c.availableStock ?? c.stock ?? 0) < 15)
                .map(comp => {
                  const available = comp.availableStock ?? (comp.stock - (comp.reservedStock || 0));
                  const isCritical = available < 8;

                  return (
                    <div key={comp._id || comp.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isCritical ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isCritical ? 'CRITICAL DEPLETION' : 'LOW STOCK WARNING'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">{comp.category}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{comp.name}</h4>
                        <span className="text-xs text-slate-500 mt-0.5 block">{comp.brand} &middot; Bin {comp.binLocation || 'A-02'}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Physical Stock</span>
                          <span className="font-bold text-slate-900 font-mono">{comp.stock} Units</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Reserved in Bays</span>
                          <span className="font-bold text-amber-600 font-mono">{comp.reservedStock || 0} Units</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Available</span>
                          <span className={`font-bold font-mono text-sm ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                            {available}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIntakeModal(comp)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Create Inbound PO Intake</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 4: INBOUND PO INTAKE INSTRUCTIONS & GRN */}
        {activeTab === 'intake' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                Goods Received Note (GRN) Intake
              </span>
              <h3 className="font-display text-2xl font-bold text-slate-900 mt-1">
                Receive Distributor Purchase Order
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Process inbound shipments from authorized distributors, increment warehouse stock, and log batch serial numbers.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleInboundIntake(
                f.componentId.value,
                f.quantity.value,
                f.poNumber.value,
                f.supplier.value,
                f.invoiceNumber.value,
                f.binLocation.value
              );
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Hardware SKU to Receive</label>
                <select 
                  required 
                  name="componentId"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {components.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      [{c.category}] {c.name} — Current Physical: {c.stock} units
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Authorized Distributor / Supplier</label>
                  <select 
                    name="supplier"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {SUPPLIERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PO / Inward Challan Number</label>
                  <input 
                    required
                    name="poNumber"
                    defaultValue={`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity Received</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    name="quantity"
                    defaultValue="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Invoice Number</label>
                  <input 
                    required
                    name="invoiceNumber"
                    defaultValue={`INV-SUP-${Math.floor(10000 + Math.random() * 90000)}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Rack Bin</label>
                  <input 
                    required
                    name="binLocation"
                    defaultValue="Rack A-02-1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Receipt & Increment Physical Stock</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: PHYSICAL STOCK ADJUSTMENT & RECONCILIATION     */}
      {/* ======================================================== */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                  Cycle Count & Stock Override
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {adjustModal.name}
                </h3>
              </div>
              <button onClick={() => setAdjustModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Physical Count</span>
                <span className="font-mono text-base font-bold text-slate-900">{adjustModal.stock}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reserved in Bays</span>
                <span className="font-mono text-base font-bold text-amber-600">{adjustModal.reservedStock || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Net Available</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  {adjustModal.availableStock ?? (adjustModal.stock - (adjustModal.reservedStock || 0))}
                </span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleAdjustStock(
                adjustModal._id || adjustModal.id,
                undefined,
                f.newStockCount.value,
                f.adjustReason.value
              );
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Set Verified Physical Units</label>
                <input 
                  required
                  type="number"
                  min="0"
                  name="newStockCount"
                  defaultValue={adjustModal.stock}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Reconciliation Reason</label>
                <select 
                  name="adjustReason"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Physical cycle count reconciliation">Physical cycle count reconciliation</option>
                  <option value="Damaged in transit write-off">Damaged in transit write-off</option>
                  <option value="Cleanroom RMA component replacement">Cleanroom RMA component replacement</option>
                  <option value="Supplier warranty return to vendor (RTV)">Supplier warranty return to vendor (RTV)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Stock Override
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INBOUND PO RECEIVING                           */}
      {/* ======================================================== */}
      {intakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">Inbound PO Intake</span>
                <h3 className="font-display text-base font-bold text-slate-900">{intakeModal.name}</h3>
              </div>
              <button onClick={() => setIntakeModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleInboundIntake(
                intakeModal._id || intakeModal.id,
                f.receivedQty.value,
                f.poNum.value,
                f.supplierName.value,
                f.invNum.value,
                f.binLoc.value
              );
            }} className="space-y-3.5 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Distributor / Supplier</label>
                <select name="supplierName" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none">
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PO Number</label>
                  <input required name="poNum" defaultValue={`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity to Receive</label>
                  <input required type="number" min="1" name="receivedQty" defaultValue="10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Invoice #</label>
                  <input required name="invNum" defaultValue={`INV-${Math.floor(10000 + Math.random() * 90000)}`} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Storage Bin</label>
                  <input required name="binLoc" defaultValue={intakeModal.binLocation || 'Rack A-02'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIntakeModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
                  Receive & Restock
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD NEW COMPONENT SKU                         */}
      {/* ======================================================== */}
      {createSkuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Catalog Registry</span>
                <h3 className="font-display text-xl font-bold text-slate-900">Add Hardware Component SKU</h3>
              </div>
              <button onClick={() => setCreateSkuModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleCreateSku({
                name: f.name.value,
                category: f.category.value,
                brand: f.brand.value,
                price: Number(f.price.value),
                stock: Number(f.stock.value),
                binLocation: f.binLocation.value,
                specifications: {
                  socket: f.socket?.value || undefined,
                  chipset: f.chipset?.value || undefined,
                  ramType: f.ramType?.value || undefined,
                  powerDraw: Number(f.powerDraw?.value) || 100
                }
              });
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Component Name & Model</label>
                <input required name="name" placeholder="e.g. AMD Ryzen 9 9950X / RTX 5080 16GB" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select name="category" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none">
                    {CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand / OEM</label>
                  <input required name="brand" placeholder="e.g. AMD, ASUS, Corsair" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price (₹ INR)</label>
                  <input required type="number" name="price" placeholder="49999" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Stock</label>
                  <input required type="number" name="stock" defaultValue="20" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Storage Bin</label>
                  <input required name="binLocation" defaultValue="Rack A-01-1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Socket / Interface (Optional)</label>
                  <input name="socket" placeholder="AM5, LGA1700, PCIe 5.0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Power Draw (W TDP)</label>
                  <input type="number" name="powerDraw" defaultValue="120" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setCreateSkuModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
                  Register SKU in Catalog
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BIN INSPECT & BARCODE                           */}
      {/* ======================================================== */}
      {binInspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">RFID Bin Location Card</span>
              <button onClick={() => setBinInspectModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-mono text-xl font-bold text-slate-900 block">
                {binInspectModal.binLocation || 'Rack A-02 · Slot 3'}
              </span>
              
              {/* Simulated Optical Barcode */}
              <div className="h-10 w-full flex justify-center items-center gap-0.5 bg-white p-2 border border-slate-200 rounded">
                {[3,1,5,2,4,6,1,3,2,5,4,2,6,3,1,4,5,2,3,6,1,4,2].map((h, i) => (
                  <div key={i} className="bg-black w-1" style={{ height: `${h * 4 + 8}px` }}></div>
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 block">
                SKU: {binInspectModal._id || binInspectModal.id}
              </span>
            </div>

            <div className="text-left text-xs space-y-1 text-slate-600">
              <p><strong>Item:</strong> {binInspectModal.name}</p>
              <p><strong>Available Stock:</strong> {binInspectModal.availableStock ?? binInspectModal.stock} units</p>
              <p><strong>Storage Condition:</strong> ESD Anti-Static Shielded Cabinet</p>
            </div>

            <div className="pt-2">
              <button onClick={() => setBinInspectModal(null)} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer">
                Close Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
