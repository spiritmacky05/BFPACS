/**
 * pages/Fleet.jsx
 *
 * Fleet management — shows registered users as responder units with ACS status tracking.
 */

import { useState, useEffect } from 'react';
import { Truck, Search, Filter } from 'lucide-react';
import { usersApi } from '@/api/users/users';
import { useAuth } from '@/context/AuthContext/AuthContext';
import { ACS_STATUSES, ACS_STATUS_COLORS, ACS_STATUS_LABELS } from '@/components/common/acsStatus';
import FleetUnitCard from '@/components/fleet/FleetUnitCard';
import FleetUnitModal from '@/components/fleet/FleetUnitModal';

const STATUS_FILTERS = ["All", ...ACS_STATUSES];

export default function Fleet() {
  const { user: currentUser, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const [responders, setResponders] = useState([]);
  const [respondersLoading, setRespondersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingUnit, setEditingUnit] = useState(null);

  const loadResponders = async () => {
    setRespondersLoading(true);
    try {
      if (isAdmin) {
        const allUsers = await usersApi.list();
        const fleet = (allUsers || []).filter(u => u.user_type === "responder" || u.role === "user");
        setResponders(fleet);
      } else {
        setResponders(currentUser ? [currentUser] : []);
      }
    } catch { setResponders([]); }
    setRespondersLoading(false);
  };

  useEffect(() => { loadResponders(); }, []);

  const isOwnUnit = (unit) => unit.email === currentUser?.email;
  const canEdit   = (unit) => isAdmin || isOwnUnit(unit);

  const handleStatusChange = async (id, acs_status) => {
    await usersApi.update(id, { acs_status });
    loadResponders();
  };

  const filtered = responders.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.type_of_vehicle?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || u.acs_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {};
  ACS_STATUSES.forEach(s => {
    counts[s] = responders.filter(u => u.acs_status === s).length;
  });
  counts["Serviceable"] = responders.filter(u => !u.acs_status || u.acs_status === "Serviceable").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {ACS_STATUSES.map(key => (
          <div key={key} className={`border rounded-xl p-4 text-center ${ACS_STATUS_COLORS[key]}`}>
            <div className="text-3xl font-bold">{counts[key]}</div>
            <div className="text-xs mt-1 font-medium">{ACS_STATUS_LABELS[key]}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, vehicle type..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1f1f1f] text-white rounded-lg text-sm focus:border-red-500 outline-none placeholder-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === s
                  ? "bg-red-600 text-white border-red-600"
                  : "text-gray-400 border-[#2a2a2a] hover:border-red-500"
              }`}
            >
              {s === "All" ? "All" : ACS_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Responder Units Table */}
      {respondersLoading ? (
        <div className="text-center text-gray-500 py-16">Loading fleet data...</div>
      ) : !filtered.length ? (
        <div className="text-center text-gray-500 py-16">
          <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No fleet units found</p>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  {["Responder / Unit", "Vehicle Type", "Capacity", "Station Commander", "ACS Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151515]">
                {filtered.map(unit => (
                  <FleetUnitCard
                    key={unit.id}
                    unit={unit}
                    canEdit={canEdit(unit)}
                    isOwnUnit={isOwnUnit(unit)}
                    statusColors={ACS_STATUS_COLORS}
                    statusLabels={ACS_STATUS_LABELS}
                    onStatusChange={handleStatusChange}
                    onEdit={() => setEditingUnit(unit)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUnit && (
        <FleetUnitModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSaved={() => { setEditingUnit(null); loadResponders(); }}
        />
      )}
    </div>
  );
}

import { ACS_STATUSES, ACS_STATUS_COLORS, ACS_STATUS_LABELS } from '@/components/common/acsStatus';
import FleetUnitCard from '@/components/fleet/FleetUnitCard';
import FleetUnitModal from '@/components/fleet/FleetUnitModal';

const STATUS_FILTERS = ["All", ...ACS_STATUSES];

// Existing fleet vehicle statuses (DB table)
const FLEET_STATUS_COLORS = {
  Serviceable: 'text-green-400 bg-green-600/10 border-green-600/30',
  Dispatched:  'text-red-400 bg-red-600/10 border-red-600/30',
  Maintenance: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  Inactive:    'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const VEHICLE_TYPES = ['Fire Truck', 'Tanker', 'Ladder Truck', 'Rescue Truck', 'Command Vehicle', 'Utility Vehicle'];
const FT_CAPACITIES = ['250 GAL', '500 GAL', '1000 GAL', '1500 GAL', '3000 GAL', '3500 GAL', '4000 GAL', 'Others'];
const EMPTY_FORM = { engine_code: '', plate_number: '', vehicle_type: 'Fire Truck', ft_capacity: '500 GAL' };

export default function Fleet() {
  const { user: currentUser, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  // ── Responder Units (user-based) ───────────────────────────────────────
  const [responders, setResponders] = useState([]);
  const [respondersLoading, setRespondersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingUnit, setEditingUnit] = useState(null);

  // ── Fleet Vehicles (DB table) ──────────────────────────────────────────
  const [fleets, setFleets] = useState([]);
  const [fleetsLoading, setFleetsLoading] = useState(true);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_FORM);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [movementLogs, setMovementLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Active tab ─────────────────────────────────────────────────────────
  const [tab, setTab] = useState("units"); // "units" | "vehicles"

  const loadResponders = async () => {
    setRespondersLoading(true);
    try {
      if (isAdmin) {
        const allUsers = await usersApi.list();
        const fleet = (allUsers || []).filter(u => u.user_type === "responder" || u.role === "user");
        setResponders(fleet);
      } else {
        setResponders(currentUser ? [currentUser] : []);
      }
    } catch { setResponders([]); }
    setRespondersLoading(false);
  };

  const loadFleets = async () => {
    setFleetsLoading(true);
    const data = await fleetApi.list();
    setFleets(data ?? []);
    setFleetsLoading(false);
  };

  const loadLogs = async (fleetId) => {
    setLogsLoading(true);
    const logs = await fleetApi.getMovementLogs(fleetId);
    setMovementLogs(logs ?? []);
    setLogsLoading(false);
  };

  useEffect(() => { loadResponders(); loadFleets(); }, []);

  const isOwnUnit = (unit) => unit.email === currentUser?.email;
  const canEdit = (unit) => isAdmin || isOwnUnit(unit);

  const handleStatusChange = async (id, acs_status) => {
    await usersApi.update(id, { acs_status });
    loadResponders();
  };

  const handleMarkServiceable = async (fleet) => {
    await Promise.all([
      fleetApi.update(fleet.id, { status: 'Serviceable' }),
      fleetApi.logMovement(fleet.id, { status_code: 'Return to Service' }),
    ]);
    loadFleets();
    if (selectedFleet?.id === fleet.id) loadLogs(fleet.id);
  };

  const handleCreateVehicle = async () => {
    setVehicleSaving(true);
    await fleetApi.create({ ...vehicleForm });
    setVehicleSaving(false);
    setShowVehicleForm(false);
    setVehicleForm(EMPTY_FORM);
    loadFleets();
  };

  const filtered = responders.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.type_of_vehicle?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || u.acs_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {};
  ACS_STATUSES.forEach(s => {
    counts[s] = responders.filter(u => u.acs_status === s).length;
  });
  counts["Serviceable"] = responders.filter(u => !u.acs_status || u.acs_status === "Serviceable").length;

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-[#1f1f1f] pb-3">
        <button onClick={() => setTab("units")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "units" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white border border-[#2a2a2a]"}`}>
          <Truck className="w-4 h-4 inline mr-2" />Responder Units
        </button>
        <button onClick={() => setTab("vehicles")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "vehicles" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white border border-[#2a2a2a]"}`}>
          <Truck className="w-4 h-4 inline mr-2" />Fleet Vehicles
        </button>
      </div>

      {/* ═══════════════════════ RESPONDER UNITS TAB ═══════════════════════ */}
      {tab === "units" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {ACS_STATUSES.map(key => (
              <div key={key} className={`border rounded-xl p-4 text-center ${ACS_STATUS_COLORS[key]}`}>
                <div className="text-3xl font-bold">{counts[key]}</div>
                <div className="text-xs mt-1 font-medium">{ACS_STATUS_LABELS[key]}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, vehicle type..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#111] border border-[#1f1f1f] text-white rounded-lg text-sm focus:border-red-500 outline-none placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    statusFilter === s
                      ? "bg-red-600 text-white border-red-600"
                      : "text-gray-400 border-[#2a2a2a] hover:border-red-500"
                  }`}
                >
                  {s === "All" ? "All" : ACS_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Fleet Table */}
          {respondersLoading ? (
            <div className="text-center text-gray-500 py-16">Loading fleet data...</div>
          ) : !filtered.length ? (
            <div className="text-center text-gray-500 py-16">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No fleet units found</p>
            </div>
          ) : (
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                      {["Responder / Unit", "Vehicle Type", "Capacity", "Station Commander", "ACS Status", "Actions"].map(h => (
                        <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#151515]">
                    {filtered.map(unit => (
                      <FleetUnitCard
                        key={unit.id}
                        unit={unit}
                        canEdit={canEdit(unit)}
                        isOwnUnit={isOwnUnit(unit)}
                        statusColors={ACS_STATUS_COLORS}
                        statusLabels={ACS_STATUS_LABELS}
                        onStatusChange={handleStatusChange}
                        onEdit={() => setEditingUnit(unit)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editingUnit && (
            <FleetUnitModal
              unit={editingUnit}
              onClose={() => setEditingUnit(null)}
              onSaved={() => { setEditingUnit(null); loadResponders(); }}
            />
          )}
        </>
      )}

      {/* ═══════════════════════ FLEET VEHICLES TAB ═══════════════════════ */}
      {tab === "vehicles" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">{fleets.length} vehicles registered</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { loadFleets(); }} className="p-2 rounded-lg border border-[#1f1f1f] text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              {role === 'superadmin' && (
                <button onClick={() => setShowVehicleForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fleet List */}
            <div className="lg:col-span-2">
              {fleetsLoading ? (
                <div className="text-center text-gray-500 py-16">Loading fleet...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fleets.map(f => (
                    <div key={f.id}
                      onClick={() => { setSelectedFleet(f); loadLogs(f.id); }}
                      className={`bg-[#111] border rounded-xl p-4 cursor-pointer transition-all hover:border-red-600/30 ${
                        selectedFleet?.id === f.id ? "border-red-600/50" : "border-[#1f1f1f]"
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-white font-semibold">{f.engine_code}</div>
                          <div className="text-gray-500 text-xs">{f.plate_number}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded border ${FLEET_STATUS_COLORS[f.status] ?? FLEET_STATUS_COLORS.Inactive}`}>
                          {f.status}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs">{f.vehicle_type}</div>
                      {(f.lat != null && f.lng != null) && (
                        <div className="flex items-center gap-1 mt-2 text-gray-600 text-xs">
                          <MapPin className="w-3 h-3" />
                          <span>{f.lat.toFixed(4)}, {f.lng.toFixed(4)}</span>
                        </div>
                      )}
                      {role === 'superadmin' && f.status === 'Dispatched' && (
                        <button
                          onClick={e => { e.stopPropagation(); handleMarkServiceable(f); }}
                          className="mt-3 w-full text-xs bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg py-1.5 transition-all">
                          ✓ Mark as Serviceable
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Movement Log Panel */}
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
              <div className="mb-4">
                <h3 className="text-white font-medium text-sm">
                  {selectedFleet ? `${selectedFleet.engine_code} — Movement Log` : 'Select a vehicle to view log'}
                </h3>
                {selectedFleet && (() => {
                  const live = fleets.find(f => f.id === selectedFleet.id) ?? selectedFleet;
                  return (
                    <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded border ${FLEET_STATUS_COLORS[live.status] ?? FLEET_STATUS_COLORS.Inactive}`}>
                      {live.status}
                    </span>
                  );
                })()}
              </div>
              {logsLoading ? (
                <div className="text-gray-500 text-xs text-center py-8">Loading...</div>
              ) : !movementLogs.length ? (
                <div className="text-gray-600 text-xs text-center py-8">No movement records</div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-96">
                  {movementLogs.map(log => (
                    <div key={log.id} className="border-l-2 border-red-600/40 pl-3">
                      <div className="text-white text-xs font-medium">{log.status_code}</div>
                      <div className="text-gray-600 text-xs">{new Date(log.recorded_at).toLocaleString()}</div>
                      {log.lat != null && (
                        <div className="text-gray-600 text-xs">{log.lat.toFixed(4)}, {log.lng.toFixed(4)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Vehicle Modal */}
          {showVehicleForm && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4 text-red-400" /> Register Vehicle
                  </h2>
                  <button onClick={() => setShowVehicleForm(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: 'Engine Code *', field: 'engine_code', placeholder: 'E-101' },
                    { label: 'Plate Number *', field: 'plate_number', placeholder: 'ABC-1234' },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field}>
                      <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</label>
                      <input value={vehicleForm[field]}
                        onChange={e => setVehicleForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Vehicle Type</label>
                    <select value={vehicleForm.vehicle_type}
                      onChange={e => setVehicleForm(f => ({ ...f, vehicle_type: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none">
                      {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Tank Capacity *</label>
                    <select value={vehicleForm.ft_capacity}
                      onChange={e => setVehicleForm(f => ({ ...f, ft_capacity: e.target.value }))}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none">
                      {FT_CAPACITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
                  <button onClick={() => setShowVehicleForm(false)} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Cancel</button>
                  <button onClick={handleCreateVehicle} disabled={vehicleSaving || !vehicleForm.engine_code || !vehicleForm.plate_number}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
                    {vehicleSaving ? 'Registering...' : 'Register Vehicle'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}