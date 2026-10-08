import React from 'react';
import { Shield, Zap, Target } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto selection:bg-red-600 selection:text-white">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6 tracking-tight">About <span className="text-red-600">BuildFlow</span></h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          We are engineers, enthusiasts, and perfectionists dedicated to building the highest quality custom workstations and gaming rigs in India.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
            <Target className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
          <p className="text-slate-600 leading-relaxed">
            To eliminate the complexity of PC building by providing an intelligent, automated studio that guarantees 100% hardware compatibility and peak performance out of the box.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Precision Engineering</h3>
          <p className="text-slate-600 leading-relaxed">
            Every rig is hand-assembled in our ISO-9001 certified cleanroom, subjected to a grueling 48-hour thermal burn-in, and securely sealed with Instapak foam.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Next-Gen Hardware</h3>
          <p className="text-slate-600 leading-relaxed">
            We partner directly with leading silicon manufacturers to guarantee authentic, top-tier GPUs, CPUs, and motherboards for uncompromising computational power.
          </p>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-3xl p-10 sm:p-16 text-center text-white shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-red-600 blur-3xl opacity-20 rounded-full"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold mb-4">Join the BuildFlow Ecosystem</h2>
          <p className="text-slate-300 text-lg mb-8">
            Whether you are training complex AI models or pushing maximum framerates, we build the engine for your ambition.
          </p>
          <a href="/builder" className="inline-block px-8 py-3.5 bg-red-600 hover:bg-red-500 rounded-xl font-bold tracking-wide transition-colors">
            Start Your Custom Build
          </a>
        </div>
      </div>
    </div>
  );
}
