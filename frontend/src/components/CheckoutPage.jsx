import React, { useState } from 'react';
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle, Truck, Package } from 'lucide-react';
import { formatINR } from '../utils/format';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage({ cart, onCheckout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // 18% GST mock
  const total = subtotal + tax;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCheckout(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
          <p className="text-slate-500 mb-6">You need to add items to your cart before checking out.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700">
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-green-100">
            <ShieldCheck className="w-4 h-4" /> Secure Checkout
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Shipping Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-red-600" /> Shipping Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="John" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                    <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="Doe" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="john@example.com" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                    <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="123 Builder Lane" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="Mumbai" />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="MH" />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Postal Code</label>
                    <input required type="text" name="zip" value={formData.zip} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm" placeholder="400001" />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" /> Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Card Number</label>
                    <input required type="text" name="cardNumber" value={formData.cardNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm font-mono" placeholder="4111 1111 1111 1111" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Expiry (MM/YY)</label>
                    <input required type="text" name="expiry" value={formData.expiry} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm font-mono" placeholder="12/26" />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">CVV</label>
                    <input required type="password" name="cvv" value={formData.cvv} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm font-mono" placeholder="•••" maxLength="4" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4 text-sm">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right font-mono font-medium text-slate-900">
                      {formatINR(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Estimated Tax (18%)</span>
                  <span className="font-mono">{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Shipping & Assembly</span>
                  <span className="font-mono text-green-600 font-medium">Free</span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 mb-6 flex justify-between items-end">
                <span className="font-bold text-slate-900 text-lg">Total</span>
                <span className="font-mono font-bold text-2xl text-red-600 tabular-nums">{formatINR(total)}</span>
              </div>

              <button 
                form="checkout-form"
                type="submit"
                disabled={loading}
                className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order Now
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-slate-400 mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
