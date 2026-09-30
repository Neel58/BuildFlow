import React, { useState, useEffect } from 'react';
import { 
  Wrench, Cpu, CheckCircle2, Clock, Check, 
  RefreshCw, ArrowRight, LogOut, Box, ArrowUpRight,
  Sparkles, Layers
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { apiRequest, clearSession } from '../utils/api';

const SLOT_ICONS = {
  CPU: '⚡',
  Motherboard: '🎛️',
  GPU: '🎮',
  RAM: '💾',
  SSD: '💿',
  Storage: '💿',
  Cooler: '❄️',
  PSU: '🔌',
  Cabinet: '🖥️'
};

export default function TechnicianDashboard({ user, onLogout, onBackToStore }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [queueOrders, setQueueOrders] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);
  const [activeView, setActiveView] = useState('bench'); // 'bench' or 'queue'

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load Assembly Data from Backend
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/assembly/tasks').catch(() => null);
      if (res && res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks);
        // Find in-progress task or first available
        const current = res.tasks.find(t => t.status === 'In Progress') || res.tasks[0];
        setActiveTask(current);
        if (current?.notes) setTechnicianNotes(current.notes);
      }

      const q = await apiRequest('/api/assembly/queue').catch(() => []);
      if (Array.isArray(q)) {
        setQueueOrders(q);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch assembly data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle single component assembled status
  const handleToggleComponent = async (slot) => {
    if (!activeTask) return;
    try {
      const item = activeTask.componentsChecklist?.find(c => c.slot.toLowerCase() === slot.toLowerCase());
      const newVerified = !item?.verified;

      // Optimistic UI update
      const updatedList = activeTask.componentsChecklist.map(c => 
        c.slot.toLowerCase() === slot.toLowerCase() ? { ...c, verified: newVerified } : c
      );
      const updatedTask = { ...activeTask, componentsChecklist: updatedList };
      setActiveTask(updatedTask);
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));

      await apiRequest(`/api/assembly/${activeTask.orderId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify({ slot, verified: newVerified })
      });

      showToast(`${slot} marked as ${newVerified ? 'assembled' : 'pending'}`);
    } catch (err) {
      showToast(err.message || 'Failed to update component', 'error');
    }
  };

  // Mark all components as assembled in one click
  const handleMarkAllAssembled = async () => {
    if (!activeTask || !activeTask.componentsChecklist) return;
    const updatedList = activeTask.componentsChecklist.map(c => ({ ...c, verified: true }));
    const updatedTask = { ...activeTask, componentsChecklist: updatedList };
    setActiveTask(updatedTask);
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));

    try {
      for (const item of activeTask.componentsChecklist) {
        if (!item.verified) {
          await apiRequest(`/api/assembly/${activeTask.orderId}/checklist`, {
            method: 'PUT',
            body: JSON.stringify({ slot: item.slot, verified: true })
          });
        }
      }
      showToast('All components marked as assembled!');
    } catch {
      // Ignored for offline tolerance
    }
  };

  // Finish Assembly & send to QA
  const handleCompleteAssembly = async () => {
    if (!activeTask) return;
    setSubmittingComplete(true);
    try {
      await apiRequest(`/api/assembly/${activeTask.orderId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({
          assemblyNotes: technicianNotes || 'Hardware assembly completed and verified by technician.',
          technicianName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Marcus Chen'
        })
      });

      showToast(`Assembly completed for ${activeTask.orderId}! Sent to QA Inspection.`, 'success');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to complete assembly', 'error');
    } finally {
      setSubmittingComplete(false);
    }
  };

  // Switch to another active task or claim an order from the queue
  const handleSelectTask = (task) => {
    setActiveTask(task);
    if (task.notes) setTechnicianNotes(task.notes);
    setActiveView('bench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaimOrderFromQueue = async (orderId) => {
    try {
      const res = await apiRequest(`/api/assembly/${orderId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          bayNumber: 'Bay 02 - Clean ESD Bench',
          technicianName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Marcus Chen',
          notes: 'Claimed from assembly queue.'
        })
      });
      if (res && res.task) {
        showToast(`Order ${orderId} claimed and loaded on bench!`);
        await loadData();
        setActiveTask(res.task);
        setActiveView('bench');
      }
    } catch (err) {
      showToast(err.message || 'Failed to claim order', 'error');
    }
  };

  // Calculate assembled counts
  const checklist = activeTask?.componentsChecklist || [];
  const assembledCount = checklist.filter(c => c.verified).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? Math.round((assembledCount / totalCount) * 100) : 0;
  const isAllAssembled = totalCount > 0 && assembledCount === totalCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-red-500 selection:text-white flex flex-col">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom duration-200 ${
          toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.message}
        </div>
      )}

      {/* CLEAN MINIMAL HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Station Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-slate-900 leading-tight">
                  Technician Station
                </h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  ESD Bench Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hardware Assembly & Component Verification
              </p>
            </div>
          </div>

          {/* Controls: Switch View, Storefront & Sign Out */}
          <div className="flex items-center gap-3">
            
            {/* Simple View Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setActiveView('bench')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeView === 'bench'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Current Build
              </button>
              <button
                onClick={() => setActiveView('queue')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'queue'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Queue</span>
                {queueOrders.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {queueOrders.length}
                  </span>
                )}
              </button>
            </div>

            <button 
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Back to Customer Storefront */}
            <button
              onClick={onBackToStore}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Storefront</span>
            </button>

            <button
              onClick={() => { clearSession(); onLogout(); }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        
        {/* VIEW 1: CURRENT BENCH BUILD (CLEAN & FOCUSED) */}
        {activeView === 'bench' && (
          <div className="space-y-6">
            
            {activeTask ? (
              <>
                {/* RIG OVERVIEW CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {activeTask.orderId}
                        </span>
                        <span>·</span>
                        <span>{activeTask.bayNumber || 'Bay 02 - Clean ESD Bench'}</span>
                        <span>·</span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          activeTask.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {activeTask.priority || 'STANDARD'}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-slate-900">
                        {activeTask.rigName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Customer: <span className="font-semibold text-slate-700">{activeTask.customer?.firstName} {activeTask.customer?.lastName}</span> ({activeTask.customer?.email})
                      </p>
                    </div>

                    {/* Progress summary & Quick Actions */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-500">Assembled:</span>
                        <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                          {assembledCount} <span className="text-sm text-slate-400">/ {totalCount}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-red-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Select Other In-Progress Rig */}
                  {tasks.length > 1 && (
                    <div className="pt-3 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
                      <span className="font-semibold text-slate-400 shrink-0">Switch build:</span>
                      {tasks.map(t => (
                        <button
                          key={t._id}
                          onClick={() => handleSelectTask(t)}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
                            t._id === activeTask._id
                              ? 'bg-slate-900 text-white font-semibold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.orderId} - {t.rigName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* THE MAIN SECTION: COMPONENTS TO BE ASSEMBLED */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Box className="w-5 h-5 text-red-600" />
                        <span>Components To Be Assembled</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify and click each component as it is installed onto the bench chassis
                      </p>
                    </div>

                    <button
                      onClick={handleMarkAllAssembled}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Mark All Assembled ✓
                    </button>
                  </div>

                  {/* CLEAN COMPONENT LIST */}
                  <div className="divide-y divide-slate-100">
                    {checklist.map((comp) => {
                      const icon = SLOT_ICONS[comp.slot] || '🔧';
                      return (
                        <div 
                          key={comp.slot}
                          onClick={() => handleToggleComponent(comp.slot)}
                          className={`py-3.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 mb-1.5 ${
                            comp.verified 
                              ? 'bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/80' 
                              : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Slot Icon Badge */}
                            <span className="text-xl w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center shrink-0 shadow-2xs">
                              {icon}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                  {comp.slot}
                                </span>
                                {comp.bin && (
                                  <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                                    Bin: {comp.bin}
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm font-semibold truncate mt-0.5 ${
                                comp.verified ? 'text-emerald-950' : 'text-slate-800'
                              }`}>
                                {comp.name}
                              </p>
                              {comp.serialNumber && (
                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                  Serial: {comp.serialNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Checkbox Status */}
                          <div className="shrink-0 flex items-center gap-2">
                            {comp.verified ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Assembled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs font-semibold hover:border-slate-400">
                                <span>Pending Install</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* TECHNICIAN NOTES & FINISH HANDOVER */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Technician Bench Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cables routed cleanly through back channels, cold post confirmed..."
                        value={technicianNotes}
                        onChange={(e) => setTechnicianNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleCompleteAssembly}
                      disabled={submittingComplete}
                      className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                        isAllAssembled
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submittingComplete ? 'Saving...' : 'Mark Complete & Send to QA'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
                  No Active Build on Bench
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Select a build from the queue below to start hand assembling components in the cleanroom.
                </p>
                <button
                  onClick={() => setActiveView('queue')}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  View Assembly Queue ({queueOrders.length})
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: ASSEMBLY QUEUE (SIMPLE & INTUITIVE) */}
        {activeView === 'queue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-red-600" />
                    <span>Assembly Queue ({queueOrders.length} Waiting)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Orders with confirmed payment and pick lists ready for cleanroom assembly
                  </p>
                </div>
              </div>

              {queueOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Queue is clear. No builds are currently waiting for assembly.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {queueOrders.map((order) => (
                    <div 
                      key={order.orderId}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {order.orderId}
                          </span>
                          <span>·</span>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            order.priority === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {order.priority || 'STANDARD'}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          {order.rigName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Customer: <span className="font-medium text-slate-700">{order.customer?.firstName} {order.customer?.lastName}</span> · 8 components picked
                        </p>
                      </div>

                      <button
                        onClick={() => handleClaimOrderFromQueue(order.orderId)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Start Assembly</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
