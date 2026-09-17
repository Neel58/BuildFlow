const API_BASE = 'http://localhost:5000/api';

import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, Cpu, Layers, ShoppingCart, Package, 
  Warehouse, Wrench, CheckCircle, Truck, Bell, FileText, 
  BarChart3, RefreshCw, Plus, Shield, Search, Terminal, AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawJson, setRawJson] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');
  const [userRole, setUserRole] = useState('Admin');

  // State for modules
  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [componentsList, setComponentsList] = useState([]);
  const [buildsList, setBuildsList] = useState([]);
  const [cartData, setCartData] = useState(null);
  const [ordersList, setOrdersList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [assemblyQueue, setAssemblyQueue] = useState([]);
  const [qaQueue, setQaQueue] = useState([]);
  const [logisticsList, setLogisticsList] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);

  // Form states
  const [newComp, setNewComp] = useState({ name: '', category: 'CPU', brand: '', price: 199, stock: 15 });
  const [newUser, setNewUser] = useState({ firstName: 'Alex', lastName: 'Rider', email: `user_${Date.now().toString().slice(-4)}@buildflow.com`, password: 'password123', role: 'Customer' });
  const [invoiceData, setInvoiceData] = useState(null);

  // Helper fetch function
  const apiFetch = async (endpoint, options = {}) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      };
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();
      setRawJson(data);
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error('API Error:', err);
      return { ok: false, data: null, error: err.message };
    }
  };

  // Health check polling
  const checkHealth = async () => {
    const res = await apiFetch('/health');
    if (res.ok) setHealth(res.data);
    else setHealth(null);
  };

  useEffect(() => {
    checkHealth();
    fetchTabContent(activeTab);
  }, [activeTab]);

  const fetchTabContent = async (tab) => {
    setLoading(true);
    if (tab === 'dashboard') {
      const res = await apiFetch('/analytics/dashboard');
      if (res.ok) setDashboardData(res.data);
    } else if (tab === 'users') {
      const res = await apiFetch('/users');
      if (res.ok) setUsersList(res.data);
    } else if (tab === 'components') {
      const res = await apiFetch('/components');
      if (res.ok) setComponentsList(res.data);
    } else if (tab === 'builds') {
      const res = await apiFetch('/builds');
      if (res.ok) setBuildsList(res.data);
    } else if (tab === 'cart') {
      const res = await apiFetch('/cart');
      if (res.ok) setCartData(res.data);
    } else if (tab === 'orders') {
      const res = await apiFetch('/orders');
      if (res.ok) setOrdersList(res.data);
    } else if (tab === 'inventory') {
      const res1 = await apiFetch('/inventory');
      if (res1.ok) setInventoryList(res1.data);
      const res2 = await apiFetch('/inventory/low-stock');
      if (res2.ok) setLowStockList(res2.data);
    } else if (tab === 'assembly') {
      const res = await apiFetch('/assembly/queue');
      if (res.ok) setAssemblyQueue(res.data);
    } else if (tab === 'qa') {
      const res = await apiFetch('/qa/queue');
      if (res.ok) setQaQueue(res.data);
    } else if (tab === 'logistics') {
      const res = await apiFetch('/logistics/queue');
      if (res.ok) setLogisticsList(res.data);
    } else if (tab === 'notifications') {
      const res = await apiFetch('/notifications/all');
      if (res.ok) setNotificationsList(res.data);
    } else if (tab === 'audit-logs') {
      const res = await apiFetch('/audit-logs');
      if (res.ok) setAuditLogsList(res.data);
    }
    setLoading(false);
  };

  // Actions
  const handleCreateComponent = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/components', { method: 'POST', body: JSON.stringify(newComp) });
    if (res.ok) {
      alert('Component created successfully!');
      fetchTabContent('components');
    } else {
      alert(`Error: ${res.data?.message || 'Failed'}`);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    const res = await apiFetch('/users/register', { method: 'POST', body: JSON.stringify(newUser) });
    if (res.ok) {
      alert(`User registered: ${newUser.email}`);
      fetchTabContent('users');
    } else {
      alert(`Error: ${res.data?.message || 'Failed'}`);
    }
  };

  const handleFetchInvoice = async (orderId) => {
    const res = await apiFetch(`/orders/${orderId}/invoice`);
    if (res.ok) {
      setInvoiceData(res.data);
    }
  };

  const handleExportReport = async (type, format = 'csv') => {
    window.open(`${API_BASE}/reports/export?type=${type}&format=${format}`, '_blank');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'components', label: 'Catalog', icon: Cpu },
    { id: 'builds', label: 'Builds', icon: Layers },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'assembly', label: 'Assembly', icon: Wrench },
    { id: 'qa', label: 'QA Inspection', icon: CheckCircle },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit-logs', label: 'Audit Logs', icon: Shield },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header Bar */}
      <header style={{
        background: 'rgba(11, 15, 25, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)'
          }}>
            <Cpu size={22} color="#000" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BuildFlow Backend Inspector
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full API Suite Visualization & Controller</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Health Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.04)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem'
          }}>
            <div className={health ? 'dot-pulse' : ''} style={{ background: health ? 'var(--accent-green)' : 'var(--accent-red)' }} />
            <span>API Server: <strong style={{ color: health ? 'var(--accent-green)' : 'var(--accent-red)' }}>{health ? 'ONLINE (Port 5000)' : 'OFFLINE'}</strong></span>
          </div>

          {/* Raw JSON toggle */}
          <button className="btn btn-secondary" onClick={() => setShowJsonModal(true)} style={{ fontSize: '0.8rem' }}>
            <Terminal size={14} /> View Response JSON
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar Nav */}
        <aside style={{
          width: '240px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRight: '1px solid var(--border-color)',
          padding: '1rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}>
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
            Navigation Modules
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: active ? 'linear-gradient(90deg, rgba(0,242,254,0.15), rgba(121,40,202,0.1))' : 'transparent',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: active ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} color={active ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            <button className="btn btn-secondary" onClick={() => fetchTabContent(activeTab)} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
            </button>
          </div>

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="glass-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Revenue</span>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '0.3rem', color: 'var(--accent-green)' }}>
                    ${dashboardData?.totalRevenue?.toLocaleString() || '12,450.00'}
                  </h3>
                </div>
                <div className="glass-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Orders</span>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '0.3rem', color: 'var(--accent-cyan)' }}>
                    {dashboardData?.activeOrdersCount ?? 4}
                  </h3>
                </div>
                <div className="glass-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed Orders</span>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '0.3rem', color: '#c084fc' }}>
                    {dashboardData?.completedOrdersCount ?? 18}
                  </h3>
                </div>
                <div className="glass-card">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inventory Low Stock</span>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '0.3rem', color: 'var(--accent-amber)' }}>
                    {dashboardData?.inventory?.lowStockComponents ?? 2}
                  </h3>
                </div>
              </div>

              {/* Quick Exports & Quick Forms */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card">
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>⚡ Quick Exports & Tools</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button className="btn btn-primary" onClick={() => handleExportReport('orders', 'csv')}>Export Orders CSV</button>
                    <button className="btn btn-secondary" onClick={() => handleExportReport('inventory', 'csv')}>Export Inventory CSV</button>
                    <button className="btn btn-secondary" onClick={() => handleExportReport('users', 'csv')}>Export Users CSV</button>
                  </div>
                </div>

                <div className="glass-card">
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>✨ Create Test Component</h4>
                  <form onSubmit={handleCreateComponent} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input placeholder="Name (e.g., Ryzen 7 7800X3D)" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} required />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select value={newComp.category} onChange={e => setNewComp({ ...newComp, category: e.target.value })}>
                        {['CPU', 'GPU', 'Motherboard', 'RAM', 'SSD', 'PSU', 'Cabinet', 'Cooler'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input placeholder="Brand" value={newComp.brand} onChange={e => setNewComp({ ...newComp, brand: e.target.value })} required />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="number" placeholder="Price $" value={newComp.price} onChange={e => setNewComp({ ...newComp, price: Number(e.target.value) })} required />
                      <input type="number" placeholder="Stock" value={newComp.stock} onChange={e => setNewComp({ ...newComp, stock: Number(e.target.value) })} required />
                    </div>
                    <button className="btn btn-primary" type="submit"><Plus size={16} /> Add Component</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card">
                <h4 style={{ marginBottom: '1rem' }}>Register New User</h4>
                <form onSubmit={handleRegisterUser} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input placeholder="First Name" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} style={{ width: '150px' }} required />
                  <input placeholder="Last Name" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} style={{ width: '150px' }} required />
                  <input placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ width: '220px' }} required />
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '130px' }}>
                    {['Customer', 'Admin', 'Warehouse', 'Technician', 'Inspector', 'Logistics'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="btn btn-primary" type="submit">Create User</button>
                </form>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length > 0 ? usersList.map(u => (
                      <tr key={u._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{u._id}</td>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td><span className="badge badge-purple">{u.role}</span></td>
                        <td><span className={`badge ${u.isActive !== false ? 'badge-green' : 'badge-red'}`}>{u.isActive !== false ? 'Active' : 'Deactivated'}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found (Use seed or create one above)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMPONENTS */}
          {activeTab === 'components' && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Total Stock</th>
                    <th>Reserved</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  {componentsList.length > 0 ? componentsList.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td><span className="badge badge-cyan">{c.category}</span></td>
                      <td>{c.brand}</td>
                      <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${c.price}</td>
                      <td>{c.stock}</td>
                      <td>{c.reservedStock || 0}</td>
                      <td><span className="badge badge-green">{c.stock - (c.reservedStock || 0)}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No components in catalog yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: BUILDS */}
          {activeTab === 'builds' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {buildsList.length > 0 ? buildsList.map(b => (
                <div key={b._id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1.1rem' }}>{b.name}</h4>
                    <span className={`badge ${b.isCompatible ? 'badge-green' : 'badge-red'}`}>
                      {b.isCompatible ? 'Compatible' : 'Issues Detected'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                    ${b.totalPrice}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Components: {b.components?.length || 0} parts</p>
                </div>
              )) : (
                <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No saved custom builds found.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CART */}
          {activeTab === 'cart' && (
            <div className="glass-card">
              <h3>Current User Cart</h3>
              <p style={{ margin: '0.5rem 0 1rem', color: 'var(--text-muted)' }}>Cart Total: <strong style={{ color: 'var(--accent-green)' }}>${cartData?.totalPrice || 0}</strong></p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Item Type</th>
                      <th>Quantity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartData?.items?.length > 0 ? cartData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td><span className="badge badge-purple">{item.itemType}</span></td>
                        <td>{item.quantity}</td>
                        <td>{item.componentId?.name || item.customBuildId?.name || 'Item'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cart is empty</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: ORDERS */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.length > 0 ? ordersList.map(o => (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{o._id}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${o.totalAmount}</td>
                        <td><span className="badge badge-cyan">{o.status}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleFetchInvoice(o._id)}>
                            View Invoice
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders placed yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {invoiceData && (
                <div className="glass-card" style={{ border: '1px solid var(--accent-cyan)' }}>
                  <h4>📄 Invoice #{invoiceData.invoiceNumber}</h4>
                  <p>Customer: {invoiceData.customer?.name} ({invoiceData.customer?.email})</p>
                  <p>Grand Total: <strong style={{ color: 'var(--accent-green)' }}>${invoiceData.summary?.grandTotal}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: INVENTORY */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lowStockList.length > 0 && (
                <div className="glass-card" style={{ border: '1px solid var(--accent-amber)' }}>
                  <h4 style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> Low Stock Threshold Alerts ({lowStockList.length})
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {lowStockList.map(item => (
                      <span key={item._id} className="badge badge-amber">{item.name}: {item.stock} left</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Stock</th>
                      <th>Reserved Stock</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryList.length > 0 ? inventoryList.map(inv => (
                      <tr key={inv._id}>
                        <td style={{ fontWeight: 600 }}>{inv.name}</td>
                        <td>{inv.stock}</td>
                        <td>{inv.reservedStock || 0}</td>
                        <td><span className="badge badge-green">{inv.stock - (inv.reservedStock || 0)}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No inventory data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: ASSEMBLY */}
          {activeTab === 'assembly' && (
            <div className="glass-card">
              <h3>Technician Assembly Queue</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Orders waiting for custom PC building</p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Assigned Tech</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assemblyQueue.length > 0 ? assemblyQueue.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item._id}</td>
                        <td><span className="badge badge-purple">{item.status}</span></td>
                        <td>{item.assignedTechnician || 'Unassigned'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders pending in assembly queue</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: QA INSPECTION */}
          {activeTab === 'qa' && (
            <div className="glass-card">
              <h3>Quality Assurance & Testing Queue</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>Stress testing & hardware verification</p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>QA Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qaQueue.length > 0 ? qaQueue.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item._id}</td>
                        <td><span className="badge badge-amber">{item.status}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders awaiting QA inspection</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: LOGISTICS */}
          {activeTab === 'logistics' && (
            <div className="glass-card">
              <h3>Logistics & Packaging Queue</h3>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Status</th>
                      <th>Tracking Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logisticsList.length > 0 ? logisticsList.map(item => (
                      <tr key={item._id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item._id}</td>
                        <td><span className="badge badge-green">{item.status}</span></td>
                        <td>{item.trackingNumber || 'Pending packaging'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders in packaging/shipment queue</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="glass-card">
              <h3>System Notification Logs</h3>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notificationsList.length > 0 ? notificationsList.map(n => (
                      <tr key={n._id}>
                        <td><span className="badge badge-cyan">{n.type}</span></td>
                        <td>{n.message}</td>
                        <td><span className="badge badge-green">{n.status}</span></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notification logs found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 12: AUDIT LOGS */}
          {activeTab === 'audit-logs' && (
            <div className="glass-card">
              <h3>Immutable Audit Trail</h3>
              <div className="table-container" style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity Type</th>
                      <th>Description</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogsList.length > 0 ? auditLogsList.map(log => (
                      <tr key={log._id}>
                        <td><span className="badge badge-purple">{log.action}</span></td>
                        <td>{log.entityType}</td>
                        <td>{log.description}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs recorded yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 13: REPORTS */}
          {activeTab === 'reports' && (
            <div className="glass-card">
              <h3>Business & Inventory Reports</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Export database records in CSV or JSON attachments</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>Orders Report</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>Full history of customer orders, status, and revenue</p>
                  <button className="btn btn-primary" onClick={() => handleExportReport('orders', 'csv')}>Export CSV</button>
                </div>

                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>Inventory Report</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>Catalog components, stock, reserved and available levels</p>
                  <button className="btn btn-primary" onClick={() => handleExportReport('inventory', 'csv')}>Export CSV</button>
                </div>

                <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <h4>Users Report</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>Registered accounts, emails, roles, and status</p>
                  <button className="btn btn-primary" onClick={() => handleExportReport('users', 'csv')}>Export CSV</button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* RAW JSON MODAL */}
      {showJsonModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Terminal size={18} /> API Response Payload</h3>
              <button className="btn btn-secondary" onClick={() => setShowJsonModal(false)}>Close</button>
            </div>
            <pre style={{
              flex: 1,
              overflow: 'auto',
              background: 'rgba(0,0,0,0.5)',
              padding: '1rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)'
            }}>
              {JSON.stringify(rawJson, null, 2) || '// Execute an API call to inspect response payload'}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
