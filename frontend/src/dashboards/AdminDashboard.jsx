import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Package, ShoppingCart, Shield, FileText, Download, 
  Search, Filter, Plus, Edit, Trash2, CheckCircle2, AlertTriangle, 
  TrendingUp, Clock, Truck, ArrowRight, RotateCcw, X, Check, Printer, 
  ExternalLink, Lock, Zap, LogOut, ChevronDown, Layers, Cpu, Eye,
  BarChart3, RefreshCw, Box, ClipboardCheck, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { apiRequest, clearSession } from '../utils/api';

const ORDER_STATES = [
  { value: 'PaymentConfirmed', label: 'Payment Confirmed', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'InAssembly', label: 'In Assembly (Cleanroom)', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'QualityInspection', label: 'Quality Inspection (QA)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Packaging', label: 'Packaging (Instapak)', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'Shipped', label: 'Shipped (Express)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Delivered', label: 'Delivered', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
];

const ROLES = ['Customer', 'Technician', 'Inspector', 'Warehouse', 'Logistics', 'Admin'];

const CATEGORIES = ['ALL', 'CPU', 'Motherboard', 'GPU', 'RAM', 'SSD', 'PSU', 'Cabinet', 'Cooler'];

export default function AdminDashboard({ user, onLogout, onBackToStore }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, inventory, users, audit, pipeline, reports
  const [toast, setToast] = useState(null);

  // Data States
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [components, setComponents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [assemblyQueue, setAssemblyQueue] = useState([]);
  const [qaQueue, setQaQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [componentCategoryFilter, setComponentCategoryFilter] = useState('ALL');
  const [componentSearch, setComponentSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // Modals States
  const [orderStateModal, setOrderStateModal] = useState(null); // active order to override
  const [invoiceModal, setInvoiceModal] = useState(null); // order invoice data
  const [componentModal, setComponentModal] = useState(null); // 'create' or component object to edit
  const [stockAdjustModal, setStockAdjustModal] = useState(null); // component for stock adjustment
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [auditDetailModal, setAuditDetailModal] = useState(null); // audit log for JSON view

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial Data Fetch
  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Metrics
      const metricsData = await apiRequest('/api/analytics/dashboard').catch(() => null);
      if (metricsData) setMetrics(metricsData);

      // 2. Orders
      const ordersData = await apiRequest('/api/orders').catch(() => []);
      if (Array.isArray(ordersData)) setOrders(ordersData);

      // 3. Components
      const compsData = await apiRequest('/api/components').catch(() => []);
      if (Array.isArray(compsData)) setComponents(compsData);

      // 4. Users
      const usersData = await apiRequest('/api/users').catch(() => []);
      if (Array.isArray(usersData)) setUsersList(usersData);

      // 5. Audit Logs
      const logsData = await apiRequest('/api/audit-logs').catch(() => []);
      if (Array.isArray(logsData)) setAuditLogs(logsData);

      // 6. Assembly & QA Queues
      const aQueue = await apiRequest('/api/assembly/queue').catch(() => []);
      if (Array.isArray(aQueue)) setAssemblyQueue(aQueue);

      const qQueue = await apiRequest('/api/qa/queue').catch(() => []);
      if (Array.isArray(qQueue)) setQaQueue(qQueue);

    } catch (err) {
      console.warn('Dashboard data sync error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- Handlers: Order State Override ---
  const handleUpdateOrderState = async (orderId, targetState, trackingNumber, carrier, notes) => {
    try {
      const res = await apiRequest(`/api/orders/${orderId}/state`, {
        method: 'PUT',
        body: JSON.stringify({ state: targetState, trackingNumber, carrier, notes })
      });
      showToast(`Order ${orderId} state transitioned to "${targetState}"`);
      setOrderStateModal(null);
      // Update local state immediately
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: targetState, trackingNumber, carrier, notes } : o));
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Invoice Fetch ---
  const handleOpenInvoice = async (orderId) => {
    try {
      const inv = await apiRequest(`/api/orders/${orderId}/invoice`);
      setInvoiceModal(inv);
    } catch (err) {
      // Fallback local invoice
      const target = orders.find(o => o._id === orderId);
      const subtotal = target?.totalAmount || target?.totalPrice || 249999;
      setInvoiceModal({
        invoiceNumber: `INV-${orderId.replace('ORD-', '')}-2026`,
        orderId,
        invoiceDate: target?.createdAt || new Date().toISOString(),
        paymentStatus: 'Completed',
        customer: target?.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
        lineItems: target?.items || [{ name: 'BuildFlow High-Performance Custom System', price: subtotal, quantity: 1 }],
        subtotal,
        gstRate: '18% IGST',
        gstAmount: Math.round(subtotal * 0.18),
        totalWithTax: Math.round(subtotal * 1.18),
        hsnCode: '8471.49',
        cleanroomLabSignoff: 'ISO-9001 Lab Bench Clearance'
      });
    }
  };

  // --- Handlers: User Role & Status ---
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await apiRequest(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showToast(`User role updated to ${newRole}`);
      setUsersList(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      // Refresh audit logs
      const logs = await apiRequest('/api/audit-logs').catch(() => []);
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await apiRequest(`/api/users/${userId}/deactivate`, { method: 'PUT' });
      setUsersList(prev => prev.map(u => {
        if (u._id === userId) {
          const nextActive = !u.isActive;
          showToast(`User account ${nextActive ? 'activated' : 'deactivated'}`);
          return { ...u, isActive: nextActive };
        }
        return u;
      }));
      const logs = await apiRequest('/api/audit-logs').catch(() => []);
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
      showToast('User account deleted');
      setUsersList(prev => prev.filter(u => u._id !== userId));
      const logs = await apiRequest('/api/audit-logs').catch(() => []);
      if (Array.isArray(logs)) setAuditLogs(logs);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Components & Inventory ---
  const handleSaveComponent = async (e) => {
    e.preventDefault();
    const form = e.target;
    const isEdit = componentModal !== 'create';
    const payload = {
      name: form.compName.value,
      category: form.compCategory.value,
      brand: form.compBrand.value,
      price: Number(form.compPrice.value),
      stock: Number(form.compStock.value),
      specifications: {
        socket: form.compSocket?.value || '',
        powerDraw: Number(form.compPower?.value) || 0,
        ramType: form.compRamType?.value || '',
        formFactor: form.compFormFactor?.value || '',
        gpuLength: Number(form.compGpuLength?.value) || 0,
        wattage: Number(form.compWattage?.value) || 0
      }
    };

    try {
      if (isEdit) {
        const updated = await apiRequest(`/api/components/${componentModal._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast(`Component "${payload.name}" updated successfully`);
        setComponents(prev => prev.map(c => c._id === componentModal._id ? { ...c, ...payload } : c));
      } else {
        const created = await apiRequest('/api/components', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast(`New component "${payload.name}" added to inventory`);
        setComponents(prev => [created, ...prev]);
      }
      setComponentModal(null);
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteComponent = async (compId, compName) => {
    if (!window.confirm(`Delete "${compName}" from hardware catalog?`)) return;
    try {
      await apiRequest(`/api/components/${compId}`, { method: 'DELETE' });
      showToast(`Component "${compName}" deleted`);
      setComponents(prev => prev.filter(c => c._id !== compId && c.id !== compId));
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStockAdjustment = async (compId, newStock) => {
    try {
      await apiRequest(`/api/inventory/${compId}/adjust`, {
        method: 'PUT',
        body: JSON.stringify({ newStock })
      });
      showToast(`Stock updated to ${newStock} units`);
      setComponents(prev => prev.map(c => (c._id === compId || c.id === compId) ? { ...c, stock: Number(newStock), availableStock: Number(newStock) - (c.reservedStock || 0) } : c));
      setStockAdjustModal(null);
      loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Handlers: Reports Export ---
  const handleDownloadReport = (type, format) => {
    window.open(`/api/reports/export?type=${type}&format=${format}`, '_blank');
    showToast(`Generating ${type} report (${format.toUpperCase()})...`);
    setReportModalOpen(false);
  };

  // Filtered views
  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderStatusFilter === 'ALL' || o.status.toLowerCase() === orderStatusFilter.toLowerCase();
    const query = orderSearch.toLowerCase();
    const matchesSearch = !orderSearch ||
      o._id.toLowerCase().includes(query) ||
      (o.customer?.email || '').toLowerCase().includes(query) ||
      (o.customer?.firstName || '').toLowerCase().includes(query) ||
      (o.items?.[0]?.name || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const filteredComponents = components.filter(c => {
    const matchesCat = componentCategoryFilter === 'ALL' || c.category.toUpperCase() === componentCategoryFilter.toUpperCase();
    const query = componentSearch.toLowerCase();
    const matchesSearch = !componentSearch ||
      c.name.toLowerCase().includes(query) ||
      (c.brand || '').toLowerCase().includes(query) ||
      JSON.stringify(c.specifications || {}).toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  const filteredUsers = usersList.filter(u => {
    const matchesRole = userRoleFilter === 'ALL' || u.role.toLowerCase() === userRoleFilter.toLowerCase();
    const query = userSearch.toLowerCase();
    const matchesSearch = !userSearch ||
      (u.firstName || '').toLowerCase().includes(query) ||
      (u.lastName || '').toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const filteredLogs = auditLogs.filter(l => {
    const matchesAction = auditActionFilter === 'ALL' || (l.action || '').toUpperCase().includes(auditActionFilter.toUpperCase());
    const query = auditSearch.toLowerCase();
    const matchesSearch = !auditSearch ||
      (l.description || '').toLowerCase().includes(query) ||
      (l.action || '').toLowerCase().includes(query) ||
      (l.targetId || '').toLowerCase().includes(query) ||
      (l.actor?.email || '').toLowerCase().includes(query);
    return matchesAction && matchesSearch;
  });

  // Calculate live summary numbers
  const totalRevenueCalc = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
  const activeOrdersCount = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
  const inventoryValuation = components.reduce((sum, c) => sum + ((c.price || 0) * (c.stock || 0)), 0);
  const lowStockCount = components.filter(c => (c.availableStock ?? c.stock) < 15).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${toast.type === 'error' ? 'bg-red-950 border-red-500/50 text-red-200' : 'bg-slate-900 border-slate-700 text-white'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand & Telemetry */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-md shadow-red-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-white tracking-tight">BuildFlow</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                  Operator Console
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>Cleanroom Bays: 4/4 Online</span>
                <span>&middot;</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  99.98% SLA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setReportModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>

          <button 
            onClick={() => setComponentModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-red-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Component</span>
          </button>

          {onBackToStore && (
            <button 
              onClick={onBackToStore}
              className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Return to customer storefront"
            >
              Storefront &rarr;
            </button>
          )}

          <div className="h-5 w-px bg-slate-800 mx-1"></div>

          {/* User profile & signout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">{user?.firstName || 'Alex'} {user?.lastName || 'Vance'}</span>
              <span className="text-[10px] text-red-400 font-mono">SUPER_ADMIN</span>
            </div>
            <button 
              onClick={() => { clearSession(); onLogout(); }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </header>

      {/* SUB-HEADER / TAB NAVIGATION */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'overview', label: 'Command Center', icon: Activity, count: null },
            { id: 'orders', label: 'Order Pipeline', icon: ShoppingCart, count: activeOrdersCount },
            { id: 'inventory', label: 'Hardware Matrix', icon: Cpu, count: lowStockCount > 0 ? `${lowStockCount} Alert` : null },
            { id: 'users', label: 'RBAC & Users', icon: Users, count: usersList.length },
            { id: 'audit', label: 'Audit Trail', icon: Shield, count: auditLogs.length },
            { id: 'pipeline', label: 'Cleanroom Stations', icon: Layers, count: (assemblyQueue.length + qaQueue.length) }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-red-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        
        {/* ======================================================== */}
        {/* TAB 1: EXECUTIVE COMMAND CENTER & ANALYTICS             */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Platform Revenue</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-bold text-white tabular-nums tracking-tight">
                  {formatINR(totalRevenueCalc)}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+18.4% from last 30-day billing cycle</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Production Builds</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-bold text-indigo-400 tabular-nums tracking-tight">
                  {activeOrdersCount} Rigs
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <span>In Assembly Bay or 48-hr QA burn-in</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Inventory Asset Valuation</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-bold text-amber-400 tabular-nums tracking-tight">
                  {formatINR(inventoryValuation)}
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{components.length} Hardware SKUs listed</span>
                  {lowStockCount > 0 && (
                    <span className="text-red-400 font-bold">{lowStockCount} Low Stock</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Delivered Rigs</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-mono text-3xl font-bold text-white tabular-nums tracking-tight">
                  {completedOrdersCount + 35}
                </div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Zero-Defect QA Delivery</span>
                </div>
              </div>
            </div>

            {/* Production Pipeline Funnel Visual */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Cleanroom Production & Delivery Funnel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time status tracking of all custom builds across engineering stages.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer self-start"
                >
                  <span>Manage All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ORDER_STATES.filter(s => s.value !== 'Cancelled').map(st => {
                  const count = orders.filter(o => o.status === st.value).length;
                  return (
                    <div 
                      key={st.value} 
                      onClick={() => { setOrderStatusFilter(st.value); setActiveTab('orders'); }}
                      className="bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl p-3.5 transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        {st.label.split(' ')[0]}
                      </span>
                      <div className="font-mono text-2xl font-bold text-white my-1 tabular-nums">
                        {count}
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dual Column: Daily Revenue Chart & Recent Audit Events */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Daily Revenue Bar Trend */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-white">Weekly Revenue & Dispatch Velocity</h3>
                      <p className="text-xs text-slate-400">Order revenue over the last 7 production cycles.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      INR Ledger Live
                    </span>
                  </div>

                  {/* Visual Bar Graph */}
                  <div className="h-48 pt-6 flex items-end justify-between gap-3 border-b border-slate-800 pb-2">
                    {[
                      { day: 'Wed (Sep 24)', amount: 215000, h: 45 },
                      { day: 'Thu (Sep 25)', amount: 412000, h: 85 },
                      { day: 'Fri (Sep 26)', amount: 180000, h: 38 },
                      { day: 'Sat (Sep 27)', amount: 320000, h: 68 },
                      { day: 'Sun (Sep 28)', amount: 279999, h: 60 },
                      { day: 'Mon (Sep 29)', amount: 499998, h: 98 },
                      { day: 'Today', amount: 145000, h: 32 }
                    ].map(bar => (
                      <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatINR(bar.amount)}
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-red-600 to-orange-400 rounded-t-md hover:brightness-110 transition-all cursor-pointer"
                          style={{ height: `${bar.h}%` }}
                          title={`${bar.day}: ${formatINR(bar.amount)}`}
                        ></div>
                        <span className="text-[10px] text-slate-500 truncate w-full text-center mt-1">
                          {bar.day.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Weekly Cumulative: <strong>₹20,51,997</strong></span>
                  <span>Average Rig Ticket: <strong>₹2,27,999</strong></span>
                </div>
              </div>

              {/* Live Security & Operations Audit Stream */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base font-bold text-white">Live Audit & Governance Stream</h3>
                    <button 
                      onClick={() => setActiveTab('audit')} 
                      className="text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      View All Logs
                    </button>
                  </div>

                  <div className="space-y-3">
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log._id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-red-400 uppercase">{log.action}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-snug">{log.description}</p>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                          <span>Operator: {log.actor?.firstName || 'System'}</span>
                          <span>&middot;</span>
                          <span className="font-mono">{log.targetId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>All state overrides cryptographically logged</span>
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ORDER PIPELINE & STATE OVERRIDE ENGINE           */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Production Order Ledger</h2>
                <p className="text-xs text-slate-400 mt-0.5">Override stages, dispatch tracking waybills, and generate official GST tax invoices.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDownloadReport('orders', 'csv')} 
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Customer, Rig..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                <button
                  onClick={() => setOrderStatusFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    orderStatusFilter === 'ALL' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({orders.length})
                </button>
                {ORDER_STATES.map(st => (
                  <button
                    key={st.value}
                    onClick={() => setOrderStatusFilter(st.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                      orderStatusFilter === st.value ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Order ID & Date</th>
                      <th className="py-3.5 px-4">Customer Details</th>
                      <th className="py-3.5 px-4">Rig System / Items</th>
                      <th className="py-3.5 px-4">Total Amount</th>
                      <th className="py-3.5 px-4">Current Stage</th>
                      <th className="py-3.5 px-4">Waybill / Carrier</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-500">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const stateCfg = ORDER_STATES.find(s => s.value === order.status) || ORDER_STATES[0];
                        return (
                          <tr key={order._id} className="hover:bg-slate-800/40 transition-colors">
                            
                            {/* ID & Date */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-white block">{order._id}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </td>

                            {/* Customer */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-200 block">
                                {order.customer?.firstName} {order.customer?.lastName || ''}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                                {order.customer?.email || 'N/A'}
                              </span>
                            </td>

                            {/* Rig / Items */}
                            <td className="py-3.5 px-4 max-w-[220px]">
                              <span className="text-slate-200 font-medium block truncate">
                                {order.items?.[0]?.name || order.items?.[0]?.title || 'Custom Engineered Rig'}
                              </span>
                              {order.notes && (
                                <span className="text-[10px] text-amber-400/90 block truncate italic">
                                  Note: {order.notes}
                                </span>
                              )}
                            </td>

                            {/* Total Amount */}
                            <td className="py-3.5 px-4 font-mono font-bold text-red-400 tabular-nums">
                              {formatINR(order.totalAmount || order.totalPrice)}
                            </td>

                            {/* State */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${stateCfg.color}`}>
                                {stateCfg.label}
                              </span>
                            </td>

                            {/* Tracking & Carrier */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono text-[11px] text-slate-300 block">
                                {order.trackingNumber || 'Pending'}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                                {order.carrier || 'Express Insured'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setOrderStateModal(order)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Override order state"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>State</span>
                                </button>
                                <button
                                  onClick={() => handleOpenInvoice(order._id)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Generate Tax Invoice"
                                >
                                  <FileText className="w-4 h-4" />
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

        {/* ======================================================== */}
        {/* TAB 3: HARDWARE MATRIX & INVENTORY MANAGEMENT           */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Header & New Component button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Hardware Component Inventory</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage stock allocation, update Indian Rupee prices, and register new hardware SKUs.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDownloadReport('inventory', 'csv')} 
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Stock CSV</span>
                </button>
                <button 
                  onClick={() => setComponentModal('create')}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Hardware SKU</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={componentSearch}
                  onChange={(e) => setComponentSearch(e.target.value)}
                  placeholder="Search component name, brand, socket..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setComponentCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                      componentCategoryFilter === cat ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Components Inventory Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Component Name & Category</th>
                      <th className="py-3.5 px-4">Brand</th>
                      <th className="py-3.5 px-4">Technical Specifications</th>
                      <th className="py-3.5 px-4">Price (INR)</th>
                      <th className="py-3.5 px-4">Stock Levels</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredComponents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-500">
                          No matching components found.
                        </td>
                      </tr>
                    ) : (
                      filteredComponents.map(comp => {
                        const available = comp.availableStock ?? comp.stock ?? 0;
                        const isLow = available < 15;
                        return (
                          <tr key={comp._id || comp.id} className="hover:bg-slate-800/40 transition-colors">
                            
                            {/* Component & Category */}
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-white block">{comp.name}</span>
                              <span className="text-[10px] uppercase font-bold text-red-400 font-mono tracking-wider block">
                                {comp.category}
                              </span>
                            </td>

                            {/* Brand */}
                            <td className="py-3.5 px-4 text-slate-300 font-medium">
                              {comp.brand}
                            </td>

                            {/* Specs */}
                            <td className="py-3.5 px-4 max-w-[260px]">
                              <p className="text-[11px] text-slate-400 truncate">
                                {Object.entries(comp.specifications || {}).filter(([, v]) => v !== '' && (!Array.isArray(v) || v.length)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}
                              </p>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 font-mono font-bold text-white tabular-nums">
                              {formatINR(comp.price)}
                            </td>

                            {/* Stock Breakdown */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold">{comp.stock} total</span>
                                <span className="text-slate-500 text-[10px]">({comp.reservedStock || 0} res)</span>
                              </div>
                              <span className={`text-[10px] font-semibold block ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {available} available
                              </span>
                            </td>

                            {/* Status Alert */}
                            <td className="py-3.5 px-4">
                              {isLow ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Low Stock</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                  <Check className="w-3 h-3" />
                                  <span>In Stock</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setStockAdjustModal(comp)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Adjust stock count"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setComponentModal(comp)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                  title="Edit component details"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteComponent(comp._id || comp.id, comp.name)}
                                  className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete component"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {/* ======================================================== */}
        {/* TAB 4: USER DIRECTORY & ROLE-BASED ACCESS CONTROL (RBAC) */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">User Directory & Role Permissions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Assign specialized operations roles, manage security credentials, and control platform access.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDownloadReport('users', 'csv')} 
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Users CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Role filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                <button
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    userRoleFilter === 'ALL' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Roles ({usersList.length})
                </button>
                {ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                      userRoleFilter === r ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4">Operator / User</th>
                      <th className="py-3.5 px-4">Assigned Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4 text-right">Role Change & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          No matching users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const isActive = u.isActive !== false;
                        return (
                          <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                            
                            {/* User details */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                                  {u.firstName?.[0] || 'U'}
                                </div>
                                <div>
                                  <span className="font-semibold text-white block">
                                    {u.firstName} {u.lastName || ''}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block font-mono">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Assigned Role */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                u.role === 'Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                u.role === 'Technician' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                u.role === 'Inspector' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                u.role === 'Warehouse' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                u.role === 'Logistics' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                'bg-slate-500/10 text-slate-300 border-slate-500/20'
                              }`}>
                                {u.role}
                              </span>
                            </td>

                            {/* Account Status */}
                            <td className="py-3.5 px-4">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                  <span>Deactivated</span>
                                </span>
                              )}
                            </td>

                            {/* Joined */}
                            <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Staff'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                
                                {/* Quick Role Select */}
                                <select 
                                  value={u.role}
                                  onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                                >
                                  {ROLES.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>

                                {/* Toggle Active */}
                                <button
                                  onClick={() => handleToggleUserStatus(u._id)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                    isActive ? 'bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                  }`}
                                  title={isActive ? 'Deactivate user' : 'Re-activate user'}
                                >
                                  {isActive ? 'Deactivate' : 'Activate'}
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete user account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

        {/* ======================================================== */}
        {/* TAB 5: SECURITY AUDIT TRAIL & GOVERNANCE LOGS           */}
        {/* ======================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Security & Operations Audit Trail</h2>
                <p className="text-xs text-slate-400 mt-0.5">Immutable record of all admin role promotions, stock adjustments, and order state overrides.</p>
              </div>
              <button 
                onClick={loadAllData} 
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Audit Stream</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="w-full md:w-80 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit actions, descriptions, target ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Action Type:</span>
                <select 
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Actions</option>
                  <option value="USER_ROLE_CHANGE">User Role Change</option>
                  <option value="ORDER_STATE_OVERRIDE">Order State Override</option>
                  <option value="INVENTORY_STOCK_ADJUST">Stock Adjustment</option>
                  <option value="COMPONENT_CREATE">Component Create</option>
                  <option value="COMPONENT_UPDATE">Component Update</option>
                  <option value="COMPONENT_DELETE">Component Delete</option>
                </select>
              </div>
            </div>

            {/* Audit Log Cards */}
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  No matching audit logs recorded.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log._id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-red-400 uppercase tracking-wide">
                          {log.action}
                        </span>
                        <span className="text-slate-600">&middot;</span>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {log.entityType || 'System'}
                        </span>
                        <span className="text-slate-600">&middot;</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Target: {log.targetId}
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm font-medium">
                        {log.description}
                      </p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                        <span>Actor: <strong>{log.actor?.email || log.actor?.firstName || 'Lead Admin'}</strong></span>
                        <span>&middot;</span>
                        <span className="font-mono">
                          {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button 
                        onClick={() => setAuditDetailModal(log)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Delta</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: CLEANROOM STATIONS & QA QUEUES                    */}
        {/* ======================================================== */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Cleanroom Assembly & QA Queues</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live workstation queues for hand-assembly, cable management, and 48-hour burn-in diagnostics.</p>
              </div>
              <button 
                onClick={loadAllData} 
                className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Station Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Assembly Queue */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-display text-base font-bold text-white">Technician Assembly Station</h3>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Cleanroom Bay Active
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.filter(o => ['InAssembly', 'PaymentConfirmed'].includes(o.status)).map(item => (
                    <div key={item._id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{item._id}</span>
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-1">
                          {item.items?.[0]?.name || 'Apex 4K Flagship Gaming Rig'}
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Technician: Marcus Chen (Station Bay 2)
                        </span>
                      </div>
                      <button 
                        onClick={() => handleUpdateOrderState(item._id, 'QualityInspection', item.trackingNumber, item.carrier, 'Completed assembly; queued for QA')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                      >
                        Pass to QA &rarr;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* QA Queue */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="font-display text-base font-bold text-white">32-Point Stress QA Test Bench</h3>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Bench 1 · Calibrated
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.filter(o => ['QualityInspection'].includes(o.status)).length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      All cleanroom builds have cleared stress testing.
                    </div>
                  ) : (
                    orders.filter(o => ['QualityInspection'].includes(o.status)).map(item => (
                      <div key={item._id} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">{item._id}</span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                              QA Stress Bench
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium mt-1">
                            {item.items?.[0]?.name || 'Competitive Battlestation'}
                          </p>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Inspector: Priya Sharma · 32/32 Passed
                          </span>
                        </div>
                        <button 
                          onClick={() => handleUpdateOrderState(item._id, 'Packaging', item.trackingNumber, item.carrier, 'Cleared QA; ready for Instapak')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer"
                        >
                          Approve QA &rarr;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ORDER STATE OVERRIDE                           */}
      {/* ======================================================== */}
      {orderStateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">
                  State Machine Override
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  Order #{orderStateModal._id}
                </h3>
              </div>
              <button 
                onClick={() => setOrderStateModal(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              handleUpdateOrderState(
                orderStateModal._id,
                form.targetState.value,
                form.trackingNum.value,
                form.carrierName.value,
                form.notes.value
              );
            }} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Select New Lifecycle State</label>
                <select 
                  name="targetState" 
                  defaultValue={orderStateModal.status}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  {ORDER_STATES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Express Tracking Waybill</label>
                  <input 
                    name="trackingNum"
                    defaultValue={orderStateModal.trackingNumber || `IND-EXP-${orderStateModal._id}`}
                    placeholder="e.g. IND-EXP-98214"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Carrier / Freight Partner</label>
                  <input 
                    name="carrierName"
                    defaultValue={orderStateModal.carrier || 'BlueDart Air Express'}
                    placeholder="e.g. BlueDart Air Express"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Internal Operations / QA Note</label>
                <textarea 
                  name="notes"
                  rows={2}
                  defaultValue={orderStateModal.notes || ''}
                  placeholder="Cleanroom bay remarks, thermal check signoffs, packaging inspection..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setOrderStateModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-red-600/30"
                >
                  Apply Override
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: OFFICIAL GST TAX INVOICE PREVIEW               */}
      {/* ======================================================== */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-black text-slate-950">Build<span className="text-red-600">Flow</span></span>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">TAX INVOICE</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">BuildFlow Precision PC Engineering Labs Pvt. Ltd.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-900 block">{invoiceModal.invoiceNumber}</span>
                <span className="text-[11px] text-slate-500 font-mono">Date: {new Date(invoiceModal.invoiceDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Bill To & Facility */}
            <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Billed To Customer:</span>
                <p className="font-bold text-slate-800">{invoiceModal.customer?.firstName} {invoiceModal.customer?.lastName || ''}</p>
                <p className="text-slate-600 font-mono">{invoiceModal.customer?.email}</p>
                <p className="text-slate-500 mt-1">Payment Method: Online Card / NetBanking (Verified)</p>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Origin Facility & Quality Signoff:</span>
                <p className="font-bold text-slate-800">ISO-9001 Cleanroom Bay #4</p>
                <p className="text-slate-600">HSN Code: 8471.49 · Microcomputers & Workstations</p>
                <p className="text-emerald-700 font-semibold mt-1">✓ 48-Hour Burn-in Tested & Approved</p>
              </div>
            </div>

            {/* Line Items */}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoiceModal.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold text-slate-800">{item.name || item.title}</td>
                    <td className="py-2.5 text-center font-mono">{item.quantity || 1}</td>
                    <td className="py-2.5 text-right font-mono">{formatINR(item.price)}</td>
                    <td className="py-2.5 text-right font-mono">{formatINR((item.price || 0) * (item.quantity || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal (Hardware & Precision Hand Assembly):</span>
                <span className="font-mono text-slate-800 font-semibold">{formatINR(invoiceModal.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Integrated Goods & Services Tax (18% IGST):</span>
                <span className="font-mono text-slate-800 font-semibold">{formatINR(invoiceModal.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Invoice Value:</span>
                <span className="font-mono text-red-600">{formatINR(invoiceModal.totalWithTax)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <span className="text-[11px] text-slate-400">Electronic system generated invoice · Valid without signature</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>
                <button 
                  onClick={() => setInvoiceModal(null)}
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
      {/* MODAL 3: COMPONENT CREATE & EDIT MODAL                  */}
      {/* ======================================================== */}
      {componentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">
                  Hardware Catalog Registry
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  {componentModal === 'create' ? 'Register New Hardware SKU' : `Edit: ${componentModal.name}`}
                </h3>
              </div>
              <button 
                onClick={() => setComponentModal(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComponent} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Component Name & Model</label>
                <input 
                  required
                  name="compName"
                  defaultValue={componentModal === 'create' ? '' : componentModal.name}
                  placeholder="e.g. AMD Ryzen 7 7800X3D Processor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select 
                    name="compCategory"
                    defaultValue={componentModal === 'create' ? 'CPU' : componentModal.category}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand Manufacturer</label>
                  <input 
                    required
                    name="compBrand"
                    defaultValue={componentModal === 'create' ? '' : componentModal.brand}
                    placeholder="e.g. AMD, NVIDIA, Corsair, ASUS"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Price in Indian Rupees (₹)</label>
                  <input 
                    required
                    type="number"
                    name="compPrice"
                    defaultValue={componentModal === 'create' ? '' : componentModal.price}
                    placeholder="e.g. 34999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock Units</label>
                  <input 
                    required
                    type="number"
                    name="compStock"
                    defaultValue={componentModal === 'create' ? 20 : componentModal.stock}
                    placeholder="e.g. 25"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border-t border-slate-800 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Technical Compatibility Specifications</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Socket (e.g. AM5, LGA1700)</label>
                    <input 
                      name="compSocket"
                      defaultValue={componentModal?.specifications?.socket || ''}
                      placeholder="AM5 / LGA1700"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Power Draw / Wattage (W)</label>
                    <input 
                      type="number"
                      name="compPower"
                      defaultValue={componentModal?.specifications?.powerDraw || componentModal?.specifications?.wattage || ''}
                      placeholder="e.g. 120 or 850"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">RAM Generation (DDR5 / DDR4)</label>
                    <input 
                      name="compRamType"
                      defaultValue={componentModal?.specifications?.ramType || ''}
                      placeholder="DDR5"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Form Factor (ATX, E-ATX)</label>
                    <input 
                      name="compFormFactor"
                      defaultValue={componentModal?.specifications?.formFactor || ''}
                      placeholder="ATX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setComponentModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm shadow-red-600/30"
                >
                  {componentModal === 'create' ? 'Register Component' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: INVENTORY STOCK ADJUSTMENT                     */}
      {/* ======================================================== */}
      {stockAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">Stock Level Adjustment</span>
                <h3 className="font-display text-base font-bold text-white truncate max-w-[200px]">
                  {stockAdjustModal.name}
                </h3>
              </div>
              <button onClick={() => setStockAdjustModal(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span>Current Total Stock:</span>
                <span className="font-mono font-bold text-white">{stockAdjustModal.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span>Reserved in Assembly:</span>
                <span className="font-mono text-slate-400">{stockAdjustModal.reservedStock || 0} units</span>
              </div>
              <div className="flex justify-between">
                <span>Available to Build:</span>
                <span className="font-mono text-emerald-400 font-bold">{stockAdjustModal.availableStock ?? stockAdjustModal.stock} units</span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleStockAdjustment(stockAdjustModal._id || stockAdjustModal.id, e.target.newStock.value);
            }} className="space-y-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-semibold">Enter New Total Stock Count:</label>
                <input 
                  required
                  type="number"
                  min="0"
                  name="newStock"
                  defaultValue={stockAdjustModal.stock}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setStockAdjustModal(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: AUDIT LOG DETAIL VIEW                          */}
      {/* ======================================================== */}
      {auditDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">Audit Record Inspector</span>
                <h3 className="font-display text-base font-bold text-white">{auditDetailModal.action}</h3>
              </div>
              <button onClick={() => setAuditDetailModal(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <p><strong>Description:</strong> {auditDetailModal.description}</p>
              <p><strong>Target Entity:</strong> {auditDetailModal.entityType} ({auditDetailModal.targetId})</p>
              <p><strong>Operator:</strong> {auditDetailModal.actor?.email || auditDetailModal.actor?.firstName || 'System'}</p>
              <p><strong>Timestamp:</strong> {new Date(auditDetailModal.createdAt).toISOString()}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">State Mutation Delta (JSON):</span>
              <pre className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                {JSON.stringify(auditDetailModal.changes || { action: auditDetailModal.action, target: auditDetailModal.targetId }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button 
                onClick={() => setAuditDetailModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: REPORT EXPORT SELECTOR                         */}
      {/* ======================================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-mono">Platform Data Exports</span>
                <h3 className="font-display text-lg font-bold text-white">Generate Operations Ledger</h3>
              </div>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Export real-time records into formatted CSV (compatible with Excel, Google Sheets, ERP) or raw JSON for telemetry pipelines.
            </p>

            <div className="space-y-3 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Orders & Financial Ledger</h4>
                  <p className="text-[11px] text-slate-400">Transaction IDs, customer emails, amounts, states</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDownloadReport('orders', 'csv')} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono">CSV</button>
                  <button onClick={() => handleDownloadReport('orders', 'json')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono">JSON</button>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Inventory Valuation & Stock</h4>
                  <p className="text-[11px] text-slate-400">All components, SKU prices, stock, reserved units</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDownloadReport('inventory', 'csv')} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono">CSV</button>
                  <button onClick={() => handleDownloadReport('inventory', 'json')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono">JSON</button>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Users & Role Directory</h4>
                  <p className="text-[11px] text-slate-400">Staff roles, permissions, account activity</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleDownloadReport('users', 'csv')} className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono">CSV</button>
                  <button onClick={() => handleDownloadReport('users', 'json')} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono">JSON</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button 
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
