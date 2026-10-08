import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const FAQS = [
  {
    question: "How long does assembly and shipping take?",
    answer: "Our standard assembly process, which includes a strict 48-hour burn-in QA test, typically takes 3-5 business days. Once passed, shipping via our secure air-freight partners takes an additional 2-4 days depending on your location in India."
  },
  {
    question: "Do you offer warranties on custom builds?",
    answer: "Yes! Every BuildFlow custom PC comes with a 3-Year Zero-Downtime Warranty covering all components and labor. If a part fails, we advance-replace it to minimize your downtime."
  },
  {
    question: "Are the components authentic and brand new?",
    answer: "Absolutely. We source all hardware directly from authorized Indian distributors (like RP Tech, Supertron, etc.). Every component comes with its original manufacturer warranty."
  },
  {
    question: "Can I upgrade my PC later?",
    answer: "Yes. Our builds use standard ATX/mATX form factors. You are free to upgrade components in the future. Our cable management is designed to make future upgrades as painless as possible."
  },
  {
    question: "How do you ensure the PC arrives safely?",
    answer: "We use Instapak expanding foam inside the chassis to lock the GPU and heavy coolers in place. The exterior is double-boxed with heavy-duty shock-absorbing foam to guarantee safe transit."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[70vh] selection:bg-red-600 selection:text-white">
      <div className="text-center mb-16">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-6 h-6 text-red-600" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-600">Everything you need to know about our custom builds and logistics.</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${openIndex === index ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
            >
              <span className={`font-semibold text-lg ${openIndex === index ? 'text-red-700' : 'text-slate-900'}`}>
                {faq.question}
              </span>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-red-500' : ''}`} />
            </button>
            
            <div 
              className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <p className="text-slate-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-16 p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center">
        <h3 className="font-bold text-slate-900 mb-2">Still have questions?</h3>
        <p className="text-slate-600 mb-6">Our support engineers are ready to help you plan your perfect build.</p>
        <a href="mailto:support@buildflow.dev" className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-900 hover:text-white transition-colors">
          Contact Support
        </a>
      </div>
    </div>
  );
}
