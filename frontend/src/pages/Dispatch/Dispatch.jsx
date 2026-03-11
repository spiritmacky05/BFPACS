import { useState } from 'react';
import { ClipboardList, Plus, X, Users, UserCheck, RefreshCw } from 'lucide-react';
import { useAuth }            from '@/context/AuthContext/AuthContext';
import { useDispatchManager } from './useDispatchManager';
import PersonnelCard          from './PersonnelCard';
import DispatchItem           from './DispatchItem';

const card         = 'bg-[#111] border border-[#1f1f1f] rounded-xl p-5';
const sectionTitle = 'text-white font-medium text-sm flex items-center gap-2';
const redIcon      = 'w-4 h-4 text-red-400';

export default function Dispatch() {
  const { role } = useAuth();
  const isAdmin  = role === 'admin' || role === 'superadmin';
  const [showForm, setShowForm] = useState(false);

  const {
    incidents, availableResponders, dispatches, personnel,
    selectedInc,        setSelectedInc,
    selectedResponders, toggleResponder,
    notes,              setNotes,
    loading, dispatching, expanded,
    handleDispatch, handleStatusUpdate, toggleExpand, refreshDispatches,
  } = useDispatchManager();

  const selectedIncident = incidents.find(i => i.id === selectedInc);

  const onDispatch = async () => {
    await handleDispatch();
    setShowForm(false);
  };

  if (loading) return <div className="text-center text-gray-500 py-16">Loading dispatch...</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">Dispatch System</h2>
            <p className="text-gray-500 text-xs">Manage fleet deployment and responder status</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> New Dispatch
          </button>
        )}
      </div>

      {/* Active incident selector */}
      <div className={card}>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Active Incident</label>
        {!incidents.length ? (
          <p className="text-gray-600 text-sm">No active incidents</p>
        ) : (
          <select
            value={selectedInc}
            onChange={e => setSelectedInc(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none"
          >
            {incidents.map(i => (
              <option key={i.id} value={i.id}>
                {i.location_text} -- {i.alarm_status}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Duty personnel grid */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={sectionTitle}>
            <UserCheck className={redIcon} />
            Duty Personnel
            <span className="ml-1 text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full font-normal">
              {personnel.filter(p => p.duty_status === 'On Duty').length} on duty
            </span>
          </h3>
        </div>
        {!personnel.length ? (
          <p className="text-gray-600 text-sm">No personnel data available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personnel.map(p => <PersonnelCard key={p.id} personnel={p} />)}
          </div>
        )}
      </div>

      {/* Dispatch log */}
      <div className={card}>
        <div className="flex items-center justify-between mb-5">
          <h3 className={sectionTitle}>
            <ClipboardList className={redIcon} />
            Dispatch Log
            {dispatches.length > 0 && (
              <span className="text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
                {dispatches.length} unit{dispatches.length !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button
            onClick={refreshDispatches}
            className="p-1.5 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {!dispatches.length ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No dispatches for this incident</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dispatches.map(d => (
              <DispatchItem
                key={d.id}
                dispatch={d}
                incident={selectedIncident}
                isAdmin={isAdmin}
                selectedInc={selectedInc}
                onStatusUpdate={handleStatusUpdate}
                expanded={expanded[d.id] ?? false}
                onToggle={() => toggleExpand(d.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Dispatch Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-red-400" /> New Dispatch Order
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Incident */}
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Active Incident</label>
                <select
                  value={selectedInc}
                  onChange={e => setSelectedInc(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none"
                >
                  <option value="">Select incident...</option>
                  {incidents.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.incident_type || 'Incident'} -- {i.location_text}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responders */}
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">
                  BFP Responders ({availableResponders.length} available)
                </label>
                {!availableResponders.length ? (
                  <p className="text-gray-600 text-xs py-2">No responders available.</p>
                ) : (
                  <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 max-h-52 overflow-y-auto space-y-1">
                    {availableResponders.map(r => (
                      <label key={r.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-1">
                        <input
                          type="checkbox"
                          checked={selectedResponders.includes(r.id)}
                          onChange={() => toggleResponder(r.id)}
                          className="accent-red-600"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-white text-sm">{r.full_name}</span>
                          {r.engine_number && (
                            <span className="text-gray-500 text-xs ml-2">#{r.engine_number}</span>
                          )}
                        </div>
                        <span className="text-gray-600 text-xs shrink-0">{r.type_of_vehicle || r.user_type}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                          r.acs_status === 'Serviceable'   ? 'text-green-400 border-green-600/30 bg-green-600/10' :
                          r.acs_status === 'ACS Activated' ? 'text-blue-400  border-blue-600/30  bg-blue-600/10'  :
                                                             'text-gray-400  border-gray-600/30  bg-gray-600/10'
                        }`}>{r.acs_status || 'Serviceable'}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Dispatch notes..."
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none resize-none placeholder-gray-700"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onDispatch}
                disabled={dispatching || !selectedInc || selectedResponders.length === 0}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {dispatching ? 'Dispatching...' : `Dispatch${selectedResponders.length > 0 ? ' (' + selectedResponders.length + ')' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
