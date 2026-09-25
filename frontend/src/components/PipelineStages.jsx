import React from 'react';
import { Cpu, ShieldCheck, Flame, Truck } from 'lucide-react';

export default function PipelineStages() {
  const steps = [
    {
      num: '01',
      title: 'Automated Fit & Wattage Check',
      desc: 'Our rule-based compatibility engine validates chipset sockets, PCIe slot clearance, DDR generation, and thermal envelopes before any part is pulled from warehouse storage.',
      icon: <Cpu className="w-5 h-5 text-red-600" />
    },
    {
      num: '02',
      title: 'Clean-Room ESD Assembly',
      desc: 'Trained technicians in grounded clean-room apparel execute clean cable routing, optimal fan curvature orientation, and high-conductivity thermal paste application.',
      icon: <ShieldCheck className="w-5 h-5 text-indigo-600" />
    },
    {
      num: '03',
      title: '48-Hour Multi-Stress QA',
      desc: 'Every completed rig undergoes MemTest86, Cinebench R24 loop, 3DMark TimeSpy extreme thermal throttling tests, and BIOS update with custom XMP/EXPO memory profiling.',
      icon: <Flame className="w-5 h-5 text-amber-600" />
    },
    {
      num: '04',
      title: 'Shock-Insulated Logistics',
      desc: 'Rigs are packed with internal high-density Instapak expanding foam to secure heavy GPUs and tower coolers, double-boxed, and shipped with tracking insurance across India.',
      icon: <Truck className="w-5 h-5 text-emerald-600" />
    }
  ];

  return (
    <section id="process" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-2xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            <span>Engineering Standard</span>
            <span>&middot;</span>
            <span>Zero Shortcuts</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            BuildFlow Precision Pipeline
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every custom system follows an exacting 4-stage assembly, testing, and delivery lifecycle mapped straight into our warehouse inventory and order management system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(step => (
            <div 
              key={step.num}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    {step.icon}
                  </div>
                  <span className="font-display text-xl font-bold text-slate-300 tabular-nums">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ISO 9001 Compliant
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
