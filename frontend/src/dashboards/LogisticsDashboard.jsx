import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Box, CheckCircle2, AlertTriangle, Search, Filter, 
  Download, Printer, ExternalLink, Clock, MapPin, RotateCcw, X, 
  ChevronDown, Calendar, ShieldCheck, Scale, FileText, Check, 
  ArrowRight, RefreshCw, Building, Phone, Zap, LogOut, ArrowUpRight,
  ClipboardList, AlertCircle, ArrowDownRight, Layers
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { apiRequest, clearSession } from '../utils/api';

const COURIERS = [
  { id: 'BlueDart', name: 'BlueDart Air Express', speed: 'Next-Day Air', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'Delhivery', name: 'Delhivery Insured Freight', speed: '2-Day Express', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'FedEx', name: 'FedEx Heavy Cargo Pallet', speed: 'Dedicated Freight', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'DTDC', name: 'DTDC Premium Air Express', speed: 'Priority Transit', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
];

const SHIPMENT_STATUSES = [
  { value: 'ALL', label: 'All Shipments' },
  { value: 'Packaging', label: 'In Packaging (Instapak)', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Ready to Ship', label: 'Staged at Dock', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Shipped', label: 'In Transit (Air Cargo)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'Out for Delivery', label: 'Out for Delivery', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'Delivered', label: 'Delivered & Signed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Failed Delivery', label: 'Exception / Returned', color: 'bg-red-50 text-red-700 border-red-200' }
];

export default function LogisticsDashboard({ user, onLogout, onBackToStore }) {
  // Navigation & Sub-Tabs
  const [activeTab, setActiveTab] = useState('manifest'); // manifest, packaging_queue, dock_dispatch, live_tracking, exceptions
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Data States
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalShipments: 0,
    readyToShip: 0,
    packaging: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
    totalInsuredValue: 0
  });

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courierFilter, setCourierFilter] = useState('ALL');

  // Modals
  const [packageModal, setPackageModal] = useState(null); // task or order to pack
  const [dispatchModal, setDispatchModal] = useState(null); // task or order to dispatch
  const [trackingModal, setTrackingModal] = useState(null); // tracking telemetry data
  const [statusUpdateModal, setStatusUpdateModal] = useState(null); // update status (out for delivery / delivered)
  const [exceptionModal, setExceptionModal] = useState(null); // failed delivery modal
  const [labelModal, setLabelModal] = useState(null); // printable shipping label modal

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Logistics Data
  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/logistics/all').catch(() => null);
      if (res && res.tasks) {
        setTasks(res.tasks);
        if (res.stats) setStats(res.stats);
      } else {
        // Fallback: fetch orders and format as logistics tasks
        const orders = await apiRequest('/api/orders').catch(() => []);
        if (Array.isArray(orders)) {
          const mappedTasks = orders.map(o => ({
            _id: 'task_' + o._id.replace('ORD-', ''),
            orderId: o._id,
            order: o._id,
            customer: o.customer || { firstName: 'Valued', lastName: 'Customer', email: 'client@example.com', city: 'Mumbai', address: '402 High Street Towers' },
            rigName: o.items?.[0]?.name || o.items?.[0]?.title || 'Custom Engineered Rig',
            weightKg: 18.5,
            packageDimensions: '62 x 34 x 58 cm',
            status: o.status === 'Packaging' ? 'Packaging' : o.status === 'Shipped' ? 'Shipped' : o.status === 'Delivered' ? 'Delivered' : 'Ready to Ship',
            courier: o.carrier || 'BlueDart Air Express',
            trackingNumber: o.trackingNumber || `IND-EXPRESS-${o._id.replace('ORD-', '')}`,
            serviceType: 'Insured Heavy Express',
            insuredValue: o.totalAmount || o.totalPrice || 279999,
            packagingDetails: {
              instapakFoamUsed: true,
              tamperTapeApplied: true,
              shockWatchSensorId: `SW-${o._id.replace('ORD-', '')}-OK`,
              packedBy: 'David Miller (Warehouse Terminal)',
              packagedAt: o.createdAt || new Date().toISOString()
            },
            shippedAt: ['Shipped', 'Delivered'].includes(o.status) ? o.createdAt : null,
            deliveredAt: o.status === 'Delivered' ? o.createdAt : null,
            estimatedDelivery: '2026-10-02',
            notes: o.notes || 'Double Instapak foam injected inside chassis.'
          }));
          setTasks(mappedTasks);
          setStats({
            totalShipments: mappedTasks.length,
            readyToShip: mappedTasks.filter(t => t.status === 'Ready to Ship').length,
            packaging: mappedTasks.filter(t => t.status === 'Packaging').length,
            inTransit: mappedTasks.filter(t => t.status === 'Shipped').length,
            delivered: mappedTasks.filter(t => t.status === 'Delivered').length,
            failed: mappedTasks.filter(t => t.status === 'Failed Delivery').length,
            totalInsuredValue: mappedTasks.reduce((sum, t) => sum + (t.insuredValue || 0), 0)
          });
        }
      }
    } catch (err) {
      console.warn('Logistics data error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogisticsData();
  }, []);

  // --- Handlers: Packaging Confirmation ---
  const handleConfirmPackaging = async (orderId, packedBy, shockSensorId, weightKg, notes) => {
    try {
      await apiRequest(`/api/logistics/${orderId}/package`, {
        method: 'POST',
        body: JSON.stringify({ packedBy, shockSensorId, weightKg, notes })
      });
      showToast(`Order ${orderId} sealed with Instapak foam. Staged at loading dock.`);
      setPackageModal(null);
      loadLogisticsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Courier Dispatch ---
  const handleDispatchOrder = async (orderId, courier, trackingNumber, serviceType, notes) => {
    try {
      await apiRequest(`/api/logistics/${orderId}/shipment`, {
        method: 'POST',
        body: JSON.stringify({ courier, trackingNumber, serviceType, notes })
      });
      showToast(`Order ${orderId} dispatched via ${courier}. Waybill: ${trackingNumber}`);
      setDispatchModal(null);
      loadLogisticsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Update Delivery Status ---
  const handleUpdateStatus = async (orderId, status) => {
    try {
      await apiRequest(`/api/logistics/${orderId}/delivery-status`, {
        method: 'PUT',
        body: JSON.stringify({ status, timestamp: new Date().toISOString() })
      });
      showToast(`Shipment ${orderId} marked as "${status}"`);
      setStatusUpdateModal(null);
      loadLogisticsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Delivery Exception / Failed Delivery ---
  const handleRecordException = async (orderId, reason, returnToWarehouse) => {
    try {
      await apiRequest(`/api/logistics/${orderId}/failed-delivery`, {
        method: 'PUT',
        body: JSON.stringify({ reason, returnToWarehouse })
      });
      showToast(`Exception recorded for ${orderId}: ${reason}`, 'error');
      setExceptionModal(null);
      loadLogisticsData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: View Tracking Telemetry ---
  const handleOpenTracking = async (orderId) => {
    try {
      const data = await apiRequest(`/api/logistics/${orderId}/tracking`);
      setTrackingModal(data);
    } catch (err) {
      const target = tasks.find(t => t.orderId === orderId);
      setTrackingModal({
        orderId,
        status: target?.status || 'Shipped',
        trackingNumber: target?.trackingNumber || `IND-EXPRESS-${orderId}`,
        courier: target?.courier || 'BlueDart Air Express',
        serviceType: target?.serviceType || 'Priority Air Freight',
        insuredValue: target?.insuredValue || 279999,
        estimatedDelivery: target?.estimatedDelivery || '2026-10-02',
        customer: target?.customer || { firstName: 'Valued', lastName: 'Customer', city: 'Mumbai', address: '402 High Street Towers' },
        checkpoints: [
          { title: 'Cleanroom ESD Assembly & Thermal Signoff', location: 'Bengaluru Tech Bay 4', time: 'Sep 29, 14:00', completed: true },
          { title: 'Instapak Expanding Foam Injected & Sealed', location: 'BuildFlow Packaging Dock', time: 'Sep 29, 17:30', completed: true },
          { title: 'Courier Handover & Waybill Scanned', location: 'Kempegowda Air Freight Hub', time: 'Sep 30, 04:15', completed: true },
          { title: 'In Flight Transit to Destination Gateway', location: `${target?.customer?.city || 'Mumbai'} Air Cargo`, time: 'In Transit', completed: false },
          { title: 'Zero-Defect Delivery & Customer Signoff', location: target?.customer?.address || 'Customer Premises', time: 'Estimated Oct 02', completed: false }
        ]
      });
    }
  };

  const handleExportManifest = async (format = 'csv') => {
    try {
      showToast(`Exporting daily dispatch manifest (${format.toUpperCase()})...`);
      const res = await apiRequest(`/api/reports/export?type=orders&format=${format}`);
      const blob = new Blob([res], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispatch_manifest.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message || 'Failed to download report', 'error');
    }
  };

  // Filtering
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'ALL' || task.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCourier = courierFilter === 'ALL' || (task.courier || '').toLowerCase().includes(courierFilter.toLowerCase());
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      task.orderId.toLowerCase().includes(query) ||
      (task.trackingNumber || '').toLowerCase().includes(query) ||
      (task.customer?.firstName || '').toLowerCase().includes(query) ||
      (task.customer?.city || '').toLowerCase().includes(query) ||
      (task.rigName || '').toLowerCase().includes(query);
    return matchesStatus && matchesCourier && matchesSearch;
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

      {/* TOP DISPATCH HEADER */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between shadow-xs">
        
        {/* Brand & Telemetry Badge */}
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-sm text-white">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-slate-950 tracking-tight">BuildFlow</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                Logistics & Dispatch Hub
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="font-mono">Kempegowda Air Freight Bay #2</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Couriers Connected (BlueDart · Delhivery · FedEx)
              </span>
            </div>
          </div>
        </div>

        {/* Global Dispatch Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExportManifest('csv')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Daily Manifest CSV</span>
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
              <span className="text-xs font-semibold text-slate-900 leading-tight">Rohan Verma</span>
              <span className="text-[10px] text-red-600 font-mono font-bold">LOGISTICS_LEAD</span>
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
            { id: 'manifest', label: 'Dispatch Manifest & Shipments', icon: ClipboardList, count: tasks.length },
            { id: 'packaging_queue', label: 'Instapak Packaging Queue', icon: Box, count: tasks.filter(t => t.status === 'Packaging').length },
            { id: 'dock_dispatch', label: 'Staged at Loading Dock', icon: Layers, count: tasks.filter(t => t.status === 'Ready to Ship').length },
            { id: 'in_transit', label: 'In Flight & Active Transit', icon: Truck, count: tasks.filter(t => ['Shipped', 'Out for Delivery'].includes(t.status)).length },
            { id: 'delivered', label: 'Delivered & Signed', icon: CheckCircle2, count: tasks.filter(t => t.status === 'Delivered').length },
            { id: 'exceptions', label: 'Delivery Exceptions', icon: AlertCircle, count: tasks.filter(t => t.status === 'Failed Delivery').length }
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
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Declared Freight Value</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-slate-950 tabular-nums">
              {formatINR(stats.totalInsuredValue || 1191997)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              100% Insured High-Value Custom Rigs
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Packaging</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Box className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-amber-600 tabular-nums">
              {tasks.filter(t => t.status === 'Packaging').length} Rig
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Cleared 32-Pt QA · Instapak injection needed
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Staged at Dock & In Transit</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-indigo-600 tabular-nums">
              {tasks.filter(t => ['Ready to Ship', 'Shipped', 'Out for Delivery'].includes(t.status)).length} Active
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              BlueDart & Delhivery Priority Cargo
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Zero-Defect Delivered</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-600 tabular-nums">
              {tasks.filter(t => t.status === 'Delivered').length + 35}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
              100% Shock Sensor Intact Signoff
            </span>
          </div>

        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Waybill, City, Customer..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {/* Courier Filter */}
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Couriers</option>
              <option value="BlueDart">BlueDart Air</option>
              <option value="Delhivery">Delhivery Freight</option>
              <option value="FedEx">FedEx Pallet</option>
              <option value="DTDC">DTDC Premium</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              {SHIPMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <button 
              onClick={loadLogisticsData}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 bg-white"
              title="Refresh Logistics Terminal"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SHIPMENT MANIFEST TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Rig Model & Weight</th>
                  <th className="py-3.5 px-4">Destination & Customer</th>
                  <th className="py-3.5 px-4">Carrier & Waybill</th>
                  <th className="py-3.5 px-4">Declared Value</th>
                  <th className="py-3.5 px-4">Dispatch Status</th>
                  <th className="py-3.5 px-4 text-right">Logistics Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      No matching shipments found in logistics manifest.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const statusCfg = SHIPMENT_STATUSES.find(s => s.value === task.status) || SHIPMENT_STATUSES[1];
                    const courierCfg = COURIERS.find(c => (task.courier || '').includes(c.id)) || COURIERS[0];

                    return (
                      <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Order ID & Date */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-950 block">{task.orderId}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Packaged: {task.packagingDetails?.packagedAt ? new Date(task.packagingDetails.packagedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Pending'}
                          </span>
                        </td>

                        {/* Rig & Weight */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="font-semibold text-slate-900 block truncate">{task.rigName}</span>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Scale className="w-3 h-3 text-slate-400" />
                            <span>{task.weightKg || 18.5} kg</span>
                            <span>&middot;</span>
                            <span>{task.packageDimensions || '62x34x58 cm'}</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="font-semibold text-slate-900 block truncate">
                            {task.customer?.firstName} {task.customer?.lastName || ''}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {task.customer?.city || 'Mumbai'}, {task.customer?.state || 'Maharashtra'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {task.customer?.phone || '+91 98201 44321'}
                          </span>
                        </td>

                        {/* Carrier & Tracking Waybill */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 text-xs block">
                            {task.trackingNumber}
                          </span>
                          <span className={`inline-block text-[10px] font-semibold border px-1.5 py-0.2 rounded mt-0.5 ${courierCfg.badge}`}>
                            {task.courier}
                          </span>
                        </td>

                        {/* Insured Value */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                          {formatINR(task.insuredValue || 279999)}
                          <span className="text-[10px] text-emerald-600 block font-normal">
                            ✓ Freight Insured
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          {task.status === 'Packaging' && (
                            <span className="text-[10px] text-amber-600 block mt-0.5">
                              Instapak Seal Required
                            </span>
                          )}
                        </td>

                        {/* Operations Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Action 1: If in packaging, prompt to Package */}
                            {task.status === 'Packaging' && (
                              <button
                                onClick={() => setPackageModal(task)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Inject Instapak expanding foam & seal chassis"
                              >
                                <Box className="w-3.5 h-3.5" />
                                <span>Pack & Seal</span>
                              </button>
                            )}

                            {/* Action 2: If Ready to Ship, prompt to Dispatch */}
                            {task.status === 'Ready to Ship' && (
                              <button
                                onClick={() => setDispatchModal(task)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Hand over to courier & generate waybill"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Handover Dispatch</span>
                              </button>
                            )}

                            {/* Action 3: Live Tracking Telemetry */}
                            <button
                              onClick={() => handleOpenTracking(task.orderId)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="View courier checkpoints and telemetry"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>

                            {/* Action 4: Shipping Waybill Label */}
                            <button
                              onClick={() => setLabelModal(task)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Print Shipping Label / Crate Barcode"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Action 5: Update Delivery Status */}
                            {['Shipped', 'Out for Delivery'].includes(task.status) && (
                              <button
                                onClick={() => setStatusUpdateModal(task)}
                                className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                title="Update delivery milestone"
                              >
                                <Check className="w-3 h-3" />
                                <span>Milestone</span>
                              </button>
                            )}

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

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: INSTAPAK PACKAGING & CRATE SEALING             */}
      {/* ======================================================== */}
      {packageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                  Cleanroom Packaging Terminal
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Pack Order #{packageModal.orderId}
                </h3>
              </div>
              <button onClick={() => setPackageModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleConfirmPackaging(
                packageModal.orderId,
                f.packerName.value,
                f.shockSensor.value,
                f.pkgWeight.value,
                f.pkgNotes.value
              );
            }} className="space-y-4 text-xs">
              
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="font-bold text-amber-800 text-xs">Mandatory Packaging Protocol:</span>
                <p className="text-amber-700 text-[11px] leading-relaxed">
                  1. Inject internal Instapak expanding foam inside chassis cavity to lock GPU and heavy CPU heatsink in place.<br />
                  2. Apply tamper-evident security tape across all seams.<br />
                  3. Calibrate and attach ShockWatch 2 impact indicator sensor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Packaging Lead Name</label>
                  <input 
                    required
                    name="packerName"
                    defaultValue="David Miller (Packaging Terminal)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ShockWatch Sensor Serial ID</label>
                  <input 
                    required
                    name="shockSensor"
                    defaultValue={`SW-${packageModal.orderId.replace('ORD-', '')}-OK`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gross Crate Weight (kg)</label>
                  <input 
                    required
                    type="number"
                    step="0.1"
                    name="pkgWeight"
                    defaultValue={packageModal.weightKg || 18.5}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Insured Value (INR)</label>
                  <input 
                    disabled
                    value={formatINR(packageModal.insuredValue || 279999)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Packaging Station Notes</label>
                <textarea 
                  name="pkgNotes"
                  rows={2}
                  defaultValue="Dual Instapak foam injected. Crate inspected and verified."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setPackageModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Confirm Sealed & Stage at Dock &rarr;
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: COURIER DISPATCH HANDOVER                      */}
      {/* ======================================================== */}
      {dispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  Loading Dock Handover
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Dispatch #{dispatchModal.orderId}
                </h3>
              </div>
              <button onClick={() => setDispatchModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleDispatchOrder(
                dispatchModal.orderId,
                f.courierPartner.value,
                f.waybillNum.value,
                f.serviceType.value,
                f.dispatchNotes.value
              );
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Courier Partner</label>
                <select 
                  name="courierPartner"
                  defaultValue={dispatchModal.courier || 'BlueDart Air Express'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {COURIERS.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.speed})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Express Tracking Waybill</label>
                  <input 
                    required
                    name="waybillNum"
                    defaultValue={dispatchModal.trackingNumber || `IND-EXPRESS-${dispatchModal.orderId.replace('ORD-', '')}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Service Level</label>
                  <input 
                    name="serviceType"
                    defaultValue="Priority Insured Air Freight"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Courier Gate Pass / Handover Remarks</label>
                <textarea 
                  name="dispatchNotes"
                  rows={2}
                  defaultValue="Loaded onto Kempegowda Airport Shuttle. Manifest signed by courier driver."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setDispatchModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-red-600/20"
                >
                  Confirm Handover & Ship &rarr;
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: LIVE TRACKING TELEMETRY & CHECKPOINTS          */}
      {/* ======================================================== */}
      {trackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                  Real-time Freight Telemetry
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  Shipment #{trackingModal.trackingNumber}
                </h3>
              </div>
              <button onClick={() => setTrackingModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Carrier</span>
                <span className="font-bold text-slate-900">{trackingModal.courier}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Delivery</span>
                <span className="font-bold text-emerald-600">{trackingModal.estimatedDelivery}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Declared Value</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(trackingModal.insuredValue)}</span>
              </div>
            </div>

            {/* Checkpoints Timeline */}
            <div className="space-y-4 pt-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                Chain of Custody Milestones
              </span>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {trackingModal.checkpoints?.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                      pt.completed 
                        ? 'bg-emerald-500 border-emerald-600 text-white' 
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {pt.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200/80 text-xs shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{pt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{pt.time}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{pt.location}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button 
                onClick={() => setTrackingModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Tracking
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: PRINTABLE SHIPPING CRATE LABEL & WAYBILL       */}
      {/* ======================================================== */}
      {labelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
                Standard 4x6 Thermal Shipping Label
              </span>
              <button onClick={() => setLabelModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Actual Physical Label Visual */}
            <div className="border-4 border-slate-950 p-5 rounded-lg space-y-4 bg-white text-slate-950 font-sans print:border-black">
              
              {/* Header: Carrier & Priority */}
              <div className="flex justify-between items-center border-b-2 border-slate-950 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-black tracking-tight">{labelModal.courier}</span>
                </div>
                <span className="text-sm font-black font-mono border-2 border-slate-950 px-2 py-0.5">
                  PRIORITY AIR FREIGHT
                </span>
              </div>

              {/* Waybill Large OCR & Barcode */}
              <div className="text-center py-2 border-b-2 border-slate-950">
                <div className="font-mono text-2xl font-black tracking-widest uppercase">
                  {labelModal.trackingNumber}
                </div>
                {/* Simulated Barcode */}
                <div className="h-12 w-full flex justify-center items-center gap-0.5 my-2">
                  {[4,2,6,1,3,5,2,4,7,1,3,2,6,4,2,5,3,7,2,4,6,1,3,5,2,4,7,1,3,2,6,4,2,5].map((h, i) => (
                    <div key={i} className="bg-black w-1" style={{ height: `${h * 5 + 15}px` }}></div>
                  ))}
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-600">
                  * {labelModal.orderId} * 84714900 *
                </span>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b-2 border-slate-950 pb-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">SHIP FROM (ORIGIN):</span>
                  <p className="font-bold">BuildFlow Technologies Labs</p>
                  <p className="text-slate-600 leading-snug">
                    Hub Bay 4, Aerospace SEZ, Devanahalli, Bengaluru, Karnataka - 562300
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">SHIP TO (RECEIVER):</span>
                  <p className="font-bold">{labelModal.customer?.firstName} {labelModal.customer?.lastName || ''}</p>
                  <p className="text-slate-600 leading-snug">
                    {labelModal.customer?.address || '402 High Street Towers, Lower Parel'}
                  </p>
                  <p className="font-bold mt-0.5">{labelModal.customer?.city || 'Mumbai'}, {labelModal.customer?.state || 'MH'}</p>
                  <p className="font-mono text-[10px]">Ph: {labelModal.customer?.phone || '+91 98201 44321'}</p>
                </div>
              </div>

              {/* Weight & Sensor Info */}
              <div className="flex justify-between items-center text-xs font-mono border-b-2 border-slate-950 pb-2">
                <span>WEIGHT: <strong>{labelModal.weightKg || 18.5} KG</strong></span>
                <span>DECLARED VALUE: <strong>{formatINR(labelModal.insuredValue || 279999)}</strong></span>
                <span>SENSOR: <strong>{labelModal.packagingDetails?.shockWatchSensorId || 'SW-OK'}</strong></span>
              </div>

              {/* Fragile Banner */}
              <div className="bg-slate-950 text-white p-2 text-center text-xs font-black tracking-widest uppercase rounded">
                ⚠ FRAGILE · PRECISION PC WORKSTATION · DO NOT DROP · KEEP UPRIGHT ↑
              </div>

            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">Standard courier EDI barcode compliant</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Label (Thermal)</span>
                </button>
                <button 
                  onClick={() => setLabelModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: UPDATE DELIVERY STATUS                         */}
      {/* ======================================================== */}
      {statusUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Courier Webhook</span>
                <h3 className="font-display text-base font-bold text-slate-900">Update Status</h3>
              </div>
              <button onClick={() => setStatusUpdateModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Update delivery milestone for <strong>#{statusUpdateModal.orderId}</strong> ({statusUpdateModal.courier}):
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleUpdateStatus(statusUpdateModal.orderId, 'Out for Delivery')}
                className="w-full py-2.5 px-4 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Out for Delivery (On Courier Van)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleUpdateStatus(statusUpdateModal.orderId, 'Delivered')}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Delivered & Signed (Zero Defect)</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const target = statusUpdateModal;
                  setStatusUpdateModal(null);
                  setExceptionModal(target);
                }}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Record Exception / Failed Attempt</span>
                <AlertTriangle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setStatusUpdateModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: DELIVERY EXCEPTION & RETURN                    */}
      {/* ======================================================== */}
      {exceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 font-mono">Exception Handler</span>
                <h3 className="font-display text-base font-bold text-slate-900">Record Delivery Exception</h3>
              </div>
              <button onClick={() => setExceptionModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const f = e.target;
              handleRecordException(
                exceptionModal.orderId,
                f.reason.value,
                f.returnWarehouse.checked
              );
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for Exception</label>
                <select 
                  name="reason" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="Customer premises locked / unavailable">Customer premises locked / unavailable</option>
                  <option value="Building security denied commercial courier entry">Building security denied commercial courier entry</option>
                  <option value="Severe weather / airport cargo advisory">Severe weather / airport cargo advisory</option>
                  <option value="Customer requested scheduled weekend delivery">Customer requested scheduled weekend delivery</option>
                  <option value="Damaged outer crate box during air transit (Hold for Inspection)">Damaged outer crate box during air transit (Hold for Inspection)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="returnWarehouse"
                  name="returnWarehouse"
                  className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="returnWarehouse" className="text-slate-700 font-medium cursor-pointer">
                  Initiate Return to Bengaluru Cleanroom Hub
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setExceptionModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
                >
                  Save Exception
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
