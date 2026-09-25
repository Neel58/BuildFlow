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
import { apiRequest, clearSession, getAccessToken, getStoredUser } from './utils/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [activePreset, setActivePreset] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(getStoredUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Initialize Route & Preset from URL
  useEffect(() => {
    const handleUrlSync = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const presetParam = params.get('preset');

      if (presetParam) {
        setActivePreset(presetParam);
      }

      if (path === '/builder' || path === '/custom-build' || path.startsWith('/builder')) {
        setCurrentRoute('builder');
      } else {
        setCurrentRoute('home');
      }
    };

    handleUrlSync();
    window.addEventListener('popstate', handleUrlSync);
    return () => window.removeEventListener('popstate', handleUrlSync);
  }, []);

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
    setCurrentRoute('builder');
    window.history.pushState({}, '', `/builder?preset=${presetKey}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToRoute = (route) => {
    setCurrentRoute(route);
    const targetUrl = route === 'builder' ? '/builder' : '/';
    window.history.pushState({}, '', targetUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  if (user.role && user.role !== 'Customer') {
    const handleLogout = () => { clearSession(); setUser(null); setCart([]); };
    
    switch (user.role) {
      case 'Admin': return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'Warehouse': return <WarehouseDashboard user={user} onLogout={handleLogout} />;
      case 'Technician': return <TechnicianDashboard user={user} onLogout={handleLogout} />;
      case 'Inspector': return <InspectorDashboard user={user} onLogout={handleLogout} />;
      case 'Logistics': return <LogisticsDashboard user={user} onLogout={handleLogout} />;
      default: 
        clearSession();
        return <AuthPage onAuthenticated={handleAuthenticated} />;
    }
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
        currentRoute={currentRoute}
        setCurrentRoute={navigateToRoute}
        cartCount={cart.reduce((sum, i) => sum + (i.quantity || 1), 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={user}
        onLogout={() => { clearSession(); setUser(null); setCart([]); }}
      />

      {/* Content Switching */}
      <main className="flex-1">
        {currentRoute === 'builder' ? (
          <CustomBuildStudio 
            onBackToHome={() => navigateToRoute('home')}
            onAddToCart={handleAddToCart}
            presetToLoad={activePreset}
          />
        ) : (
          <>
            <HeroSection 
              onStartCustomBuild={() => navigateToRoute('builder')}
            />

            <PipelineStages />

            <FlagshipBuilds 
              onAddToCart={handleAddToCart}
              onCustomizePreset={navigateToBuilderWithPreset}
            />

            {/* Quick Studio Callout Banner on Homepage */}
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
                  onClick={() => navigateToRoute('builder')}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-xl shadow-lg shadow-red-600/30 transition-all whitespace-nowrap cursor-pointer shrink-0"
                >
                  Start Custom Build Studio &rarr;
                </button>
              </div>
            </section>

            <ComponentCatalog 
              onAddToCart={handleAddToCart}
              onConfigureInStudio={() => navigateToRoute('builder')}
            />
          </>
        )}
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
