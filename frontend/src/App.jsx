import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CustomBuildStudio from './components/CustomBuildStudio';
import FlagshipBuilds from './components/FlagshipBuilds';
import ComponentCatalog from './components/ComponentCatalog';
import PipelineStages from './components/PipelineStages';
import OrderTrackingModal from './components/OrderTrackingModal';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AuthPage from './components/AuthPage';
import AdminDashboard from './dashboards/AdminDashboard';
import WarehouseDashboard from './dashboards/WarehouseDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import InspectorDashboard from './dashboards/InspectorDashboard';
import LogisticsDashboard from './dashboards/LogisticsDashboard';
import { apiRequest, clearSession, getAccessToken, getStoredUser, setSession } from './utils/api';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePreset, setActivePreset] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(getStoredUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) return;
    apiRequest('/api/cart')
      .then(data => setCart((data.items || []).map(item => ({
        id: item._id,
        backendId: item._id,
        title: item.componentId?.name || item.customBuildId?.name || 'BuildFlow item',
        price: item.componentId?.price || item.customBuildId?.totalPrice || 0,
        quantity: item.quantity,
        itemType: item.itemType
      }))))
      .catch(() => clearSession());
  }, []);

  const handleAuthenticated = (session) => {
    setUser(session);
    apiRequest('/api/cart').then(data => setCart((data.items || []).map(item => ({
      id: item._id,
      backendId: item._id,
      title: item.componentId?.name || item.customBuildId?.name || 'BuildFlow item',
      price: item.componentId?.price || item.customBuildId?.totalPrice || 0,
      quantity: item.quantity,
      itemType: item.itemType
    }))));
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = async (item) => {
    if (!getAccessToken()) {
      setIsAuthOpen(true);
      return;
    }
    if (!item?._id && item?.type !== 'customBuild') {
      showToast('Select a database component before adding it to the cart.');
      return;
    }
    try {
      let itemId = item._id;
      let itemType = 'Component';
      if (item.type === 'customBuild') {
        const build = await apiRequest('/api/builds', {
          method: 'POST',
          body: JSON.stringify({ name: item.name, componentIds: item.componentIds })
        });
        itemId = build._id;
        itemType = 'CustomBuild';
      }
      const data = await apiRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId })
      });
      setCart((data.items || []).map(cartItem => ({
        id: cartItem._id,
        backendId: cartItem._id,
        title: cartItem.componentId?.name || cartItem.customBuildId?.name || 'BuildFlow item',
        price: cartItem.componentId?.price || cartItem.customBuildId?.totalPrice || 0,
        quantity: cartItem.quantity,
        itemType: cartItem.itemType
      })));
      setIsCartOpen(true);
      showToast(`Added "${item.name || 'custom build'}" to your shopping cart!`);
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleRemoveFromCart = async (id) => {
    try {
      const data = await apiRequest(`/api/cart/remove/${id}`, { method: 'DELETE' });
      setCart((data.items || []).map(item => ({
        id: item._id,
        backendId: item._id,
        title: item.componentId?.name || item.customBuildId?.name || 'BuildFlow item',
        price: item.componentId?.price || item.customBuildId?.totalPrice || 0,
        quantity: item.quantity,
        itemType: item.itemType
      })));
    } catch (error) {
      showToast(error.message);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const result = await apiRequest('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const confirmed = await apiRequest('/api/orders/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ orderId: result.order._id })
      });
      setCart([]);
      setIsCartOpen(false);
      setActiveTrackingId(confirmed.order._id);
      setIsTrackingOpen(true);
      showToast('Order created and queued from the backend.');
    } catch (error) {
      showToast(error.message);
    }
  };

  const navigateToBuilderWithPreset = (presetKey) => {
    setActivePreset(presetKey);
    navigate(`/builder?preset=${presetKey}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToRoute = (route) => {
    if (route === 'builder') navigate('/builder');
    else navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // RequireRole: renders children only if user has the required role, else redirects to store.
  // This is defense-in-depth — user.role only comes from a real verified login (real JWT).
  const RequireRole = ({ role, children }) => {
    if (!user || user.role !== role) {
      navigate('/');
      return null;
    }
    return children;
  };

  const handleLogout = () => { clearSession(); setUser(null); setCart([]); navigate('/'); };
  const handleBackToStore = () => { navigate('/'); };

  if (user?.role && user.role !== 'Customer') {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Read-only station header — role comes from real JWT, cannot be changed here */}
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Station Mode: <strong className="text-red-400 uppercase">{user.role}</strong></span>
            <span className="text-slate-500">({user.email})</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBackToStore}
              className="text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              &larr; Store
            </button>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
        <div className="flex-1">
          {user.role === 'Admin' && <AdminDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />}
          {user.role === 'Warehouse' && <WarehouseDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />}
          {user.role === 'Technician' && <TechnicianDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />}
          {user.role === 'Inspector' && <InspectorDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />}
          {user.role === 'Logistics' && <LogisticsDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200">
          {notification}
        </div>
      )}

      {/* Main Navigation */}
      <Navbar 
        cartCount={cart.reduce((sum, i) => sum + (i.quantity || 1), 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Content Switching via React Router */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={
            <>
              <HeroSection 
                onStartCustomBuild={() => navigate('/builder')} 
                onCustomizePreset={navigateToBuilderWithPreset}
                onAddToCart={handleAddToCart}
              />
              <PipelineStages />
              <FlagshipBuilds onAddToCart={handleAddToCart} onCustomizePreset={navigateToBuilderWithPreset} />
              <section className="py-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-1">Interactive Studio</span>
                    <h3 className="font-display text-2xl sm:text-3xl font-bold">
                      Need Custom Specs with 8 Dedicated Hardware Slots?
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-xl">
                      Configure AM5/LGA1700 sockets, DDR5 speeds, PCIe 5.0 storage, chassis clearances, and PSU wattage headroom in real time with Indian Rupee (₹) pricing.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/builder')}
                    className="px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-600/30 transition-all whitespace-nowrap cursor-pointer shrink-0"
                  >
                    Start Custom Build Studio &rarr;
                  </button>
                </div>
              </section>
              <ComponentCatalog onAddToCart={handleAddToCart} onConfigureInStudio={() => navigate('/builder')} />
            </>
          } />

          <Route path="/builder" element={
            <CustomBuildStudio 
              onBackToHome={() => navigate('/')}
              onAddToCart={handleAddToCart}
              presetToLoad={activePreset}
            />
          } />

          <Route path="/components" element={
            <div className="pt-8">
              <ComponentCatalog onAddToCart={handleAddToCart} onConfigureInStudio={() => navigate('/builder')} />
            </div>
          } />

          <Route path="/workstations" element={
            <div className="pt-8">
              <FlagshipBuilds onAddToCart={handleAddToCart} onCustomizePreset={navigateToBuilderWithPreset} />
            </div>
          } />

          <Route path="/assembly-qa" element={
            <div className="pt-8">
              <PipelineStages />
            </div>
          } />

          <Route path="/orders" element={
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Track Your Orders</h2>
              <p className="text-slate-600 mb-8 max-w-md">Enter your tracking number or view your recent orders to see their current assembly and shipping status.</p>
              <button onClick={() => setIsTrackingOpen(true)} className="px-6 py-3 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 font-semibold">
                Open Tracking Tool
              </button>
            </div>
          } />

          <Route path="/checkout" element={
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Complete Your Order</h2>
              <p className="text-slate-600 mb-8">Review your items and proceed with secure payment to queue your custom build for assembly.</p>
              <button onClick={handleCheckout} className="px-8 py-4 bg-red-600 text-white rounded-xl shadow-xl shadow-red-600/20 hover:bg-red-700 font-bold text-lg w-full sm:w-auto">
                Confirm & Pay Securely
              </button>
            </div>
          } />

          <Route path="/admin" element={
            <AdminDashboard 
              user={user?.role === 'Admin' ? user : { firstName: 'Alex', lastName: 'Vance', email: 'admin@buildflow.dev', role: 'Admin' }} 
              onLogout={() => { clearSession(); setUser(null); setCart([]); navigate('/'); }} 
              onBackToStore={() => { handleSelectRole('Customer'); navigate('/'); }} 
            />
          } />

          <Route path="/technician" element={
            <TechnicianDashboard 
              user={user?.role === 'Technician' ? user : { firstName: 'Marcus', lastName: 'Chen', email: 'technician@buildflow.dev', role: 'Technician', badgeId: 'TECH-409' }} 
              onLogout={() => { clearSession(); setUser(null); setCart([]); navigate('/'); }} 
              onBackToStore={() => { handleSelectRole('Customer'); navigate('/'); }} 
            />
          } />

          <Route path="/assembly" element={<Navigate to="/technician" replace />} />

          <Route path="/inspector" element={
            <InspectorDashboard 
              user={user?.role === 'Inspector' ? user : { firstName: 'Priya', lastName: 'Sharma', email: 'inspector@buildflow.dev', role: 'Inspector' }} 
              onLogout={() => { clearSession(); setUser(null); setCart([]); navigate('/'); }} 
              onBackToStore={() => { handleSelectRole('Customer'); navigate('/'); }} 
            />
          } />

          <Route path="/qa" element={<Navigate to="/inspector" replace />} />

          <Route path="/logistics" element={
            <LogisticsDashboard 
              user={user?.role === 'Logistics' ? user : { firstName: 'Rohan', lastName: 'Verma', email: 'logistics@buildflow.dev', role: 'Logistics' }} 
              onLogout={() => { clearSession(); setUser(null); setCart([]); navigate('/'); }} 
              onBackToStore={() => { handleSelectRole('Customer'); navigate('/'); }} 
            />
          } />

          <Route path="/dispatch" element={<Navigate to="/logistics" replace />} />

          <Route path="/warehouse" element={
            <WarehouseDashboard 
              user={user?.role === 'Warehouse' ? user : { firstName: 'David', lastName: 'Miller', email: 'warehouse@buildflow.dev', role: 'Warehouse' }} 
              onLogout={() => { clearSession(); setUser(null); setCart([]); navigate('/'); }} 
              onBackToStore={() => { handleSelectRole('Customer'); navigate('/'); }} 
            />
          } />

          <Route path="/inventory" element={<Navigate to="/warehouse" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialOrderId={activeTrackingId}
      />

      {/* Footer */}
      <Footer onNavigate={navigateToRoute} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />

    </div>
  );
}
