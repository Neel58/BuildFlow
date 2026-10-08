import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CustomBuildStudio from './components/CustomBuildStudio';
import FlagshipBuilds from './components/FlagshipBuilds';
import ComponentCatalog from './components/ComponentCatalog';
import PipelineStages from './components/PipelineStages';
import OrderTrackingModal from './components/OrderTrackingModal';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import AuthPage from './components/AuthPage';
import AboutUs from './components/AboutUs';
import FAQ from './components/FAQ';
import AdminDashboard from './dashboards/AdminDashboard';
import WarehouseDashboard from './dashboards/WarehouseDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import InspectorDashboard from './dashboards/InspectorDashboard';
import LogisticsDashboard from './dashboards/LogisticsDashboard';
import { apiRequest, clearSession, getAccessToken, getStoredUser, setSession } from './utils/api';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';

export const getRoleDestination = (role) => {
  switch (role) {
    case 'Admin': return '/admin';
    case 'Technician': return '/technician';
    case 'Inspector': return '/inspector';
    case 'Warehouse': return '/warehouse';
    case 'Logistics': return '/logistics';
    case 'Customer':
    default: return '/';
  }
};

function RoleProtectedRoute({ user, allowedRoles, onOpenAuth, onLogout, children }) {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Station Access Required</h2>
          <p className="text-sm text-slate-500 mb-6">
            This operational console requires authenticated station credentials with role: <strong className="text-slate-800">{allowedRoles.join(' or ')}</strong>.
          </p>
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={onOpenAuth}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors cursor-pointer shadow-md shadow-red-600/20"
            >
              Sign In to Station
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    const userDestination = getRoleDestination(user.role);
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-amber-200 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Access Restricted (RBAC)
          </span>
          <h2 className="font-display text-2xl font-bold text-slate-900 mt-3 mb-2">Unauthorized Station</h2>
          <p className="text-sm text-slate-500 mb-2">
            You are currently signed in as <strong className="text-slate-900 font-bold">{user.role}</strong> ({user.email}).
          </p>
          <p className="text-xs text-slate-400 mb-6">
            This console is restricted to <span className="font-semibold text-slate-700">{allowedRoles.join(' or ')}</span> personnel only.
          </p>
          <div className="flex flex-col gap-2.5">
            {user.role !== 'Customer' && (
              <button 
                onClick={() => navigate(userDestination)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm shadow-md"
              >
                Go to Your Station ({user.role}) &rarr;
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Station Mode Header Banner */}
      <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Station Mode: <strong className="text-red-400 uppercase tracking-wide">{user.role}</strong></span>
          <span className="text-slate-500 hidden sm:inline">({user.email})</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            &larr; Store
          </button>
          <button 
            onClick={onLogout}
            className="text-xs font-semibold bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

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
    })))).catch(() => {});
    
    showToast(`Signed in as ${session.firstName || ''} (${session.role || 'Customer'})`);
    const destination = getRoleDestination(session.role);
    navigate(destination);
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
        if (!item.componentIds || item.componentIds.length === 0 || item.componentIds.some(id => !id)) {
          showToast('Some components in your build are not from the database. Please select valid parts in the Studio.');
          return;
        }
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

  const handleCheckout = async (formData) => {
    if (cart.length === 0) return;
    try {
      const result = await apiRequest('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ shippingDetails: formData })
      });
      const confirmed = await apiRequest('/api/orders/confirm-payment', {
        method: 'POST',
        body: JSON.stringify({ orderId: result.order._id })
      });
      setCart([]);
      setIsCartOpen(false);
      navigate(`/order-success/${confirmed.order._id}`);
    } catch (error) {
      showToast(error.message);
      throw error;
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

  const handleLogout = () => { 
    clearSession(); 
    setUser(null); 
    setCart([]); 
    navigate('/'); 
    showToast('Signed out successfully.');
  };
  const handleBackToStore = () => { 
    navigate('/'); 
  };

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
            <CheckoutPage cart={cart} onCheckout={handleCheckout} />
          } />

          <Route path="/order-success/:orderId" element={
            <OrderSuccessPage onOpenTracking={(id) => {
              setActiveTrackingId(id);
              setIsTrackingOpen(true);
            }} />
          } />

          <Route path="/about" element={
            <AboutUs />
          } />

          <Route path="/faq" element={
            <FAQ />
          } />

          {/* CURATED ROLE-BASED OPERATIONAL STATIONS (RBAC PROTECTED) */}
          <Route path="/admin" element={
            <RoleProtectedRoute user={user} allowedRoles={['Admin']} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout}>
              <AdminDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />
            </RoleProtectedRoute>
          } />

          <Route path="/technician" element={
            <RoleProtectedRoute user={user} allowedRoles={['Technician', 'Admin']} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout}>
              <TechnicianDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />
            </RoleProtectedRoute>
          } />
          <Route path="/assembly" element={<Navigate to="/technician" replace />} />

          <Route path="/inspector" element={
            <RoleProtectedRoute user={user} allowedRoles={['Inspector', 'Admin']} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout}>
              <InspectorDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />
            </RoleProtectedRoute>
          } />
          <Route path="/qa" element={<Navigate to="/inspector" replace />} />

          <Route path="/warehouse" element={
            <RoleProtectedRoute user={user} allowedRoles={['Warehouse', 'Admin']} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout}>
              <WarehouseDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />
            </RoleProtectedRoute>
          } />
          <Route path="/inventory" element={<Navigate to="/warehouse" replace />} />

          <Route path="/logistics" element={
            <RoleProtectedRoute user={user} allowedRoles={['Logistics', 'Admin']} onOpenAuth={() => setIsAuthOpen(true)} onLogout={handleLogout}>
              <LogisticsDashboard user={user} onLogout={handleLogout} onBackToStore={handleBackToStore} />
            </RoleProtectedRoute>
          } />
          <Route path="/dispatch" element={<Navigate to="/logistics" replace />} />

          {/* Full Page Dedicated Auth Routes */}
          <Route path="/auth" element={<AuthPage onAuthenticated={handleAuthenticated} />} />
          <Route path="/login" element={<AuthPage onAuthenticated={handleAuthenticated} />} />
          <Route path="/register" element={<AuthPage onAuthenticated={handleAuthenticated} />} />

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
