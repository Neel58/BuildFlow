import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckCircle2, XCircle, Check, 
  RefreshCw, ArrowRight, LogOut, Box, ArrowUpRight,
  Layers, ShieldCheck, Thermometer, Zap, AlertTriangle, FileText
} from 'lucide-react';
import { apiRequest, clearSession } from '../utils/api';

const COMPONENT_ICONS = {
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

export default function InspectorDashboard({ user, onLogout, onBackToStore }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [activeView, setActiveView] = useState('bench'); // 'bench' or 'queue'
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load QA Data from Backend
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/qa/tasks').catch(() => null);
      if (res && res.tasks && res.tasks.length > 0) {
        setTasks(res.tasks);
        // Find pending inspection or first task
        const pending = res.tasks.find(t => t.decision === 'Pending') || res.tasks[0];
        setActiveTask(pending);
        if (pending?.report) {
          setInspectorNotes(pending.report);
        }
      } else {
        // Fallback queue call
        const q = await apiRequest('/api/qa/queue').catch(() => []);
        if (Array.isArray(q) && q.length > 0) {
          // Construct task view if needed
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch QA data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle QA checklist item
  const handleToggleCheck = async (checkId) => {
    if (!activeTask) return;
    try {
      const targetCheck = activeTask.checks?.find(c => c.id === checkId);
      const newPassed = !targetCheck?.passed;

      // Optimistic UI update
      const updatedChecks = activeTask.checks.map(c => 
        c.id === checkId ? { ...c, passed: newPassed } : c
      );
      const updatedTask = { ...activeTask, checks: updatedChecks };
      setActiveTask(updatedTask);
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));

      await apiRequest(`/api/qa/${activeTask.orderId}/check`, {
        method: 'PUT',
        body: JSON.stringify({ checkId, passed: newPassed })
      });

      showToast(`Test [${targetCheck?.label}] marked as ${newPassed ? 'Passed' : 'Pending'}`);
    } catch (err) {
      showToast(err.message || 'Failed to update QA test check', 'error');
    }
  };

  // Mark all tests as passed
  const handlePassAllChecks = async () => {
    if (!activeTask || !activeTask.checks) return;
    const updatedChecks = activeTask.checks.map(c => ({ ...c, passed: true }));
    const updatedTask = { ...activeTask, checks: updatedChecks };
    setActiveTask(updatedTask);
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));

    try {
      for (const c of activeTask.checks) {
        if (!c.passed) {
          await apiRequest(`/api/qa/${activeTask.orderId}/check`, {
            method: 'PUT',
            body: JSON.stringify({ checkId: c.id, passed: true })
          });
        }
      }
      showToast('All QA diagnostic tests marked as Passed!');
    } catch {
      // Ignored for offline tolerance
    }
  };

  // Submit QA Decision (Pass or Fail)
  const handleDecision = async (decision) => {
    if (!activeTask) return;
    setSubmittingDecision(true);
    try {
      const inspectorName = user?.firstName 
        ? `${user.firstName} ${user.lastName || ''}`.trim() 
        : 'Priya Sharma';

      const res = await apiRequest(`/api/qa/${activeTask.orderId}/decision`, {
        method: 'PUT',
        body: JSON.stringify({
          decision,
          report: inspectorNotes || (decision === 'Passed' ? 'System passed all hardware & thermal diagnostic benchmarks.' : 'Defect flagged during QA inspection.'),
          inspectorName
        })
      });

      if (decision === 'Passed') {
        showToast(`System ${activeTask.orderId} PASSED QA! Dispatched to Packaging.`, 'success');
      } else {
        showToast(`System ${activeTask.orderId} flagged as DEFECT. Sent back to assembly.`, 'error');
      }

      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to submit QA decision', 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Switch active task
  const handleSelectTask = (task) => {
    setActiveTask(task);
    if (task.report) setInspectorNotes(task.report);
    setActiveView('bench');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculations
  const checksList = activeTask?.checks || [];
  const passedChecksCount = checksList.filter(c => c.passed).length;
  const totalChecksCount = checksList.length;
  const progressPercent = totalChecksCount > 0 ? Math.round((passedChecksCount / totalChecksCount) * 100) : 0;
  const isAllTestsPassed = totalChecksCount > 0 && passedChecksCount === totalChecksCount;

  const pendingTasksList = tasks.filter(t => t.decision === 'Pending');

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

      {/* CLEAN LIGHT HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Station Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-slate-900 leading-tight">
                  QA Inspector Station
                </h1>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Chamber 01 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Post-Assembly Verification & Thermal Stress Testing
              </p>
            </div>
          </div>

          {/* Controls: Switch View, Storefront & Sign Out */}
          <div className="flex items-center gap-3">
            
            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
              <button
                onClick={() => setActiveView('bench')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeView === 'bench'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Current System
              </button>
              <button
                onClick={() => setActiveView('queue')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'queue'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>QA Queue</span>
                {pendingTasksList.length > 0 && (
                  <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingTasksList.length}
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
        
        {/* VIEW 1: CURRENT INSPECTION (CLEAN & FOCUSED) */}
        {activeView === 'bench' && (
          <div className="space-y-6">
            
            {activeTask ? (
              <>
                {/* SYSTEM OVERVIEW CARD */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {activeTask.orderId}
                        </span>
                        <span>·</span>
                        <span>{activeTask.chamberNumber || 'QA Chamber 01 - Thermal Loop'}</span>
                        <span>·</span>
                        <span>Assembled by <strong className="text-slate-700">{activeTask.technicianName || 'Marcus Chen'}</strong></span>
                        <span>·</span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                          activeTask.decision === 'Passed' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : activeTask.decision === 'Failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {activeTask.decision === 'Pending' ? 'READY FOR TESTING' : activeTask.decision.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-slate-900">
                        {activeTask.rigName}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Customer: <span className="font-semibold text-slate-700">{activeTask.customer?.firstName} {activeTask.customer?.lastName}</span> ({activeTask.customer?.email})
                      </p>
                    </div>

                    {/* Progress summary */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-500">Tests Passed:</span>
                        <span className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                          {passedChecksCount} <span className="text-sm text-slate-400">/ {totalChecksCount}</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-teal-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Switch to other pending rig in queue */}
                  {tasks.length > 1 && (
                    <div className="pt-3 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto">
                      <span className="font-semibold text-slate-400 shrink-0">Switch system:</span>
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

                {/* 1. ASSEMBLED COMPONENTS TO BE INSPECTED */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="pb-4 mb-4 border-b border-slate-100">
                    <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Box className="w-5 h-5 text-teal-600" />
                      <span>Assembled Hardware Components</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify physical component presence and serial tags matched from the assembly bench
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeTask.components?.map((comp) => {
                      const icon = COMPONENT_ICONS[comp.slot] || '🔧';
                      return (
                        <div 
                          key={comp.slot}
                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3"
                        >
                          <span className="text-xl w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                            {icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {comp.slot}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 truncate block">
                              {comp.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              {comp.serialNumber || 'SN-VERIFIED'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CORE QA DIAGNOSTIC TESTS */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-slate-100">
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-teal-600" />
                        <span>Quality & Stability Checks</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Conduct cold POST, thermal stress loops, and physical inspection
                      </p>
                    </div>

                    <button
                      onClick={handlePassAllChecks}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Pass All Tests ✓
                    </button>
                  </div>

                  {/* CHECKLIST ROWS */}
                  <div className="space-y-2.5">
                    {checksList.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => handleToggleCheck(test.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          test.passed
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200/90'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <button
                            type="button"
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              test.passed
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                            }`}
                          >
                            {test.passed && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>

                          <div>
                            <h4 className={`text-xs font-bold ${test.passed ? 'text-emerald-950' : 'text-slate-900'}`}>
                              {test.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {test.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {test.passed ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                              Passed ✓
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* INSPECTOR NOTES & DECISION CONTROLS */}
                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        QA Inspection Report & Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CPU peak 68°C, zero memory errors in MemTest86, glass film clean..."
                        value={inspectorNotes}
                        onChange={(e) => setInspectorNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleDecision('Failed')}
                        disabled={submittingDecision}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-white border border-red-300 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Flag Defect & Reject</span>
                      </button>

                      <button
                        onClick={() => handleDecision('Passed')}
                        disabled={submittingDecision}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isAllTestsPassed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{submittingDecision ? 'Submitting...' : 'Pass & Approve for Packaging'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-slate-900 mb-1">
                  No Rig Currently in Inspection Chamber
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Select a completed build from the QA queue below to run diagnostics and thermal stress testing.
                </p>
                <button
                  onClick={() => setActiveView('queue')}
                  className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-colors"
                >
                  View QA Queue ({tasks.length})
                </button>
              </div>
            )}

          </div>
        )}

        {/* VIEW 2: QA QUEUE (SIMPLE & INTUITIVE) */}
        {activeView === 'queue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-600" />
                    <span>QA Inspection Queue ({tasks.length} Total Systems)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Systems handed over from the assembly benches waiting for quality verification
                  </p>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No systems waiting for QA. Cleanroom benches are currently assembling incoming orders.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tasks.map((task) => (
                    <div 
                      key={task._id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {task.orderId}
                          </span>
                          <span>·</span>
                          <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                            task.decision === 'Passed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : task.decision === 'Failed'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {task.decision === 'Pending' ? 'READY FOR TESTING' : task.decision.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          {task.rigName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assembled by: <span className="font-medium text-slate-700">{task.technicianName || 'Marcus Chen'}</span> · Customer: {task.customer?.firstName} {task.customer?.lastName}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectTask(task)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Inspect System</span>
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
