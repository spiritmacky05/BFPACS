import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LogIn, Plus, X, CreditCard, CheckCircle, Clock, Building2, Search, Users } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  "Checked In": "text-green-400 bg-green-600/10 border-green-600/30",
  "Checked Out": "text-gray-400 bg-gray-600/10 border-gray-600/30",
};

export default function IncidentCheckInPanel({ incidentId, isAdmin }) {
  const [checkins, setCheckins] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showStationForm, setShowStationForm] = useState(false);
  const [form, setForm] = useState({ personnel_id: "", nfc_tag_id: "", notes: "" });
  const [selectedStation, setSelectedStation] = useState("");
  const [stationSearch, setStationSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [nfcInput, setNfcInput] = useState("");
  const [checkInMethod, setCheckInMethod] = useState("nfc");

  useEffect(() => {
    if (!incidentId || !isAdmin) {
      setLoading(false);
      return;
    }

    Promise.all([
      base44.entities.IncidentCheckIn.filter({ incident_id: incidentId }),
      base44.entities.Personnel.list(),
      base44.entities.FireStation.list(),
      base44.entities.User.list(),
    ])
      .then(([c, p, s, u]) => {
        setCheckins(c);
        setPersonnel(p);
        setStations(s);
        setUsers(u);
      })
      .finally(() => setLoading(false));
  }, [incidentId, isAdmin]);

  const handleNfcScan = () => {
    if (!nfcInput.trim()) return;
    const found = personnel.find(
      (p) => p.nfc_tag_id === nfcInput || p.badge_number === nfcInput
    );
    if (found) {
      setForm((f) => ({ ...f, personnel_id: found.id, nfc_tag_id: nfcInput }));
      setNfcInput("");
      setShowForm(true);
    } else {
      alert("NFC tag / badge not found in system.");
    }
  };

  const handleCheckIn = async () => {
    if (!form.personnel_id) return;
    setSaving(true);
    try {
      await base44.entities.IncidentCheckIn.create({
        personnel_id: form.personnel_id,
        incident_id: incidentId,
        nfc_tag_id: form.nfc_tag_id || null,
        check_in_time: new Date().toISOString(),
        status: "Checked In",
        notes: form.notes || null,
      });
      setForm({ personnel_id: "", nfc_tag_id: "", notes: "" });
      setShowForm(false);

      // Reload checkins
      const updated = await base44.entities.IncidentCheckIn.filter({
        incident_id: incidentId,
      });
      setCheckins(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (checkInId) => {
    await base44.entities.IncidentCheckIn.update(checkInId, {
      check_out_time: new Date().toISOString(),
      status: "Checked Out",
    });
    const updated = await base44.entities.IncidentCheckIn.filter({
      incident_id: incidentId,
    });
    setCheckins(updated);
  };

  const getPersonnelName = (id) =>
    personnel.find((p) => p.id === id)?.full_name || id;

  const handleStationCheckIn = async () => {
    if (!selectedStation) return;
    setSaving(true);
    try {
      const response = await base44.functions.invoke('bulkCheckInStation', {
        incident_id: incidentId,
        fire_station_id: selectedStation
      });
      if (response.data.success) {
        setSelectedStation("");
        setStationSearch("");
        setShowStationForm(false);
        // Reload checkins
        const updated = await base44.entities.IncidentCheckIn.filter({
          incident_id: incidentId,
        });
        setCheckins(updated);
      }
    } catch (error) {
      alert('Error checking in station: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Get inactive users with their fire stations
  const inactiveUsers = personnel
    .map(p => {
      const user = users.find(u => u.id === p.user_id);
      const station = stations.find(s => s.id === p.fire_station_id);
      return user && user.acs_status === "inactive" && station
        ? { personnel: p, user, station }
        : null;
    })
    .filter(Boolean);

  // Filter by search term
  const filteredInactiveUsers = inactiveUsers.filter(item =>
    item.station.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
    item.personnel.full_name.toLowerCase().includes(stationSearch.toLowerCase())
  );

  // Group by station
  const groupedByStation = filteredInactiveUsers.reduce((acc, item) => {
    const stationId = item.station.id;
    if (!acc[stationId]) {
      acc[stationId] = { station: item.station, users: [] };
    }
    acc[stationId].users.push(item);
    return acc;
  }, {});

  // Filter stations for station check-in
  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(stationSearch.toLowerCase()) ||
    s.city.toLowerCase().includes(stationSearch.toLowerCase())
  );

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="text-gray-500 text-sm">Loading check-in data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Check-In Method Tabs */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => setCheckInMethod("nfc")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            checkInMethod === "nfc"
              ? "bg-red-600/20 border border-red-600/40 text-red-400"
              : "border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40"
          }`}
        >
          NFC Check-In
        </button>
        <button
          onClick={() => setCheckInMethod("manual")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            checkInMethod === "manual"
              ? "bg-red-600/20 border border-red-600/40 text-red-400"
              : "border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-red-600/40"
          }`}
        >
          Manual Check-In
        </button>
        <button
          onClick={() => setCheckInMethod("station")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            checkInMethod === "station"
              ? "bg-blue-600/20 border border-blue-600/40 text-blue-400"
              : "border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-blue-600/40"
          }`}
        >
          Check-in Station
        </button>
      </div>

      {/* NFC Check-In Method */}
      {checkInMethod === "nfc" && (
        <div className="bg-gradient-to-r from-red-950/30 to-[#111] border border-red-900/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600/20 border border-red-600/40 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">NFC Check-In</h3>
              <p className="text-gray-500 text-xs">Scan badge or enter NFC tag ID</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Tap NFC card or enter Badge No..."
              value={nfcInput}
              onChange={(e) => setNfcInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNfcScan()}
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-4 py-3 text-sm focus:border-red-600 outline-none placeholder-gray-600"
            />
            <button
              onClick={handleNfcScan}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Check In
            </button>
          </div>
        </div>
      )}

      {/* Manual Check-In Method */}
      {checkInMethod === "manual" && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border border-red-600/40 text-red-400 hover:bg-red-600/10 px-4 py-3 rounded-lg text-sm font-medium transition-all"
        >
          <Building2 className="w-4 h-4" /> Select Fire Station
        </button>
      )}

      {/* Station Check-In Method */}
      {checkInMethod === "station" && (
        <button
          onClick={() => setShowStationForm(true)}
          className="w-full flex items-center justify-center gap-2 border border-blue-600/40 text-blue-400 hover:bg-blue-600/10 px-4 py-3 rounded-lg text-sm font-medium transition-all"
        >
          <Building2 className="w-4 h-4" /> Select Station
        </button>
      )}

      {/* Check-in List */}
      {checkins.length > 0 && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center gap-2">
            <LogIn className="w-4 h-4 text-red-400" />
            <span className="text-white font-semibold text-sm">
              Incident Check-Ins
            </span>
            <span className="ml-auto text-gray-600 text-xs">{checkins.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  {["Personnel", "Status", "Check-In", "Check-Out", "Action"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-gray-500 text-xs uppercase tracking-wider px-4 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151515]">
                {checkins.map((c) => (
                  <tr key={c.id} className="hover:bg-white/2 transition-all">
                    <td className="px-4 py-3 text-white font-medium text-xs">
                      {getPersonnelName(c.personnel_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${
                          statusColors[c.status] || statusColors["Checked In"]
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(c.check_in_time), "h:mm a")}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {c.check_out_time
                        ? format(new Date(c.check_out_time), "h:mm a")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {!c.check_out_time && (
                        <button
                          onClick={() => handleCheckOut(c.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Station Check-in Modal */}
      {showStationForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" /> Check-in Station
              </h2>
              <button
                onClick={() => setShowStationForm(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3">
                  Search Fire Station
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search station name..."
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-blue-600 outline-none placeholder-gray-600"
                  />
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                  {filteredStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => setSelectedStation(station.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                        selectedStation === station.id
                          ? "bg-blue-600/20 border-blue-600/40 text-blue-300"
                          : "bg-[#0a0a0a] border-[#2a2a2a] text-gray-400 hover:text-white hover:border-blue-600/40"
                      }`}
                    >
                      <div className="font-medium">{station.name}</div>
                      <div className="text-xs text-gray-600">{station.city}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
              <button
                onClick={() => setShowStationForm(false)}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleStationCheckIn}
                disabled={saving || !selectedStation}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Checking in..." : "Confirm Check-In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Check-in Modal — Search & List Users by Station */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <LogIn className="w-4 h-4 text-red-400" /> Manual Check-In
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setStationSearch("");
                }}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-3">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search station or user..."
                    value={stationSearch}
                    onChange={(e) => setStationSearch(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-red-600 outline-none placeholder-gray-600"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                {Object.values(groupedByStation).length > 0 ? (
                  Object.values(groupedByStation).map(({ station, users: stationUsers }) => (
                    <div key={station.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-4">
                      <div className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-red-400" />
                        {station.name} ({station.city})
                      </div>
                      <div className="space-y-2">
                        {stationUsers.map(({ personnel: p, user }) => (
                          <button
                            key={p.id}
                            onClick={async () => {
                              setSaving(true);
                              try {
                                await base44.entities.IncidentCheckIn.create({
                                  personnel_id: p.id,
                                  incident_id: incidentId,
                                  check_in_time: new Date().toISOString(),
                                  status: "Checked In",
                                });
                                const updated = await base44.entities.IncidentCheckIn.filter({
                                  incident_id: incidentId,
                                });
                                setCheckins(updated);
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className="w-full text-left px-3 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded hover:border-red-600/40 hover:bg-red-900/10 transition-all text-sm disabled:opacity-50"
                          >
                            <div className="text-white font-medium">{p.full_name}</div>
                            <div className="text-gray-600 text-xs">{p.rank} • {p.badge_number}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-600 text-xs py-8 text-center">No inactive users found</div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#1f1f1f] flex justify-end">
              <button
                onClick={() => {
                  setShowForm(false);
                  setStationSearch("");
                }}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}