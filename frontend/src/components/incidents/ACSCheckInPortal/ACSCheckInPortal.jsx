/**
 * ACSCheckInPortal
 *
 * Two-step modal: Select a personnel member → confirm manual check-in.
 * Adapted from bfpacs_update — uses our checkinApi and personnelApi.
 */

import { useState, useEffect } from "react";
import { personnelApi } from "@/api/personnel/personnel";
import { checkinApi } from "@/api/checkin/checkin";
import { equipmentApi } from "@/api/equipment/equipment";
import { X, Search, Truck, Users, Package, CheckCircle, ChevronRight, Wifi } from "lucide-react";
import { format } from "date-fns";

export default function ACSCheckInPortal({ incidentId, onClose, onCheckInComplete }) {
  const [step, setStep] = useState("select_responder"); // select_responder | confirm
  const [search, setSearch] = useState("");
  const [allPersonnel, setAllPersonnel] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [relatedEquipment, setRelatedEquipment] = useState([]);

  useEffect(() => {
    Promise.all([
      personnelApi.list(),
      equipmentApi.list(),
    ]).then(([personnel, equipment]) => {
      setAllPersonnel(personnel || []);
      setAllEquipment(equipment || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Only show On Duty personnel as candidates
  const onDutyPersonnel = allPersonnel.filter(p => p.duty_status === "On Duty");

  const handleSelectPersonnel = (person) => {
    setSelectedPersonnel(person);

    // Filter serviceable equipment for the same station
    const stationEquipment = allEquipment.filter(eq =>
      eq.status === "Serviceable" && eq.station_id === person.station_id
    );
    setRelatedEquipment(stationEquipment);

    setStep("confirm");
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedPersonnel) return;
    setSaving(true);
    try {
      await checkinApi.manual({
        personnel_id: selectedPersonnel.id,
        incident_id: incidentId,
      });

      onCheckInComplete?.();
      onClose();
    } catch (error) {
      if (error.status === 409) {
        alert("This personnel member is already checked in to this incident.");
      } else {
        console.error("Check-in failed:", error);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredPersonnel = onDutyPersonnel.filter(p =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.rank?.toLowerCase().includes(search.toLowerCase()) ||
    p.designation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600/20 border border-green-600/40 rounded-lg flex items-center justify-center">
              <Wifi className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">ACS Check-In Portal</h2>
              <p className="text-gray-500 text-xs">
                {step === "select_responder" ? "Select an on-duty personnel to check in" : `Confirm check-in for ${selectedPersonnel?.full_name}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step: Select Personnel */}
        {step === "select_responder" && (
          <>
            <div className="p-6 border-b border-[#1f1f1f]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, rank, or designation..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-green-600 outline-none placeholder-gray-600"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {loading ? (
                <div className="text-gray-500 text-sm text-center py-8">Loading personnel...</div>
              ) : filteredPersonnel.length === 0 ? (
                <div className="text-gray-600 text-sm text-center py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No on-duty personnel available
                </div>
              ) : (
                filteredPersonnel.map(person => (
                  <button
                    key={person.id}
                    onClick={() => handleSelectPersonnel(person)}
                    className="w-full text-left px-4 py-3.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-green-600/40 hover:bg-green-900/10 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{person.full_name}</div>
                          <div className="text-gray-500 text-xs">{person.rank} • {person.designation || "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded border text-green-400 bg-green-600/10 border-green-600/30">
                          On Duty
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Step: Confirm Check-In */}
        {step === "confirm" && selectedPersonnel && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Personnel Summary */}
              <div className="bg-[#0a0a0a] border border-green-600/30 rounded-lg p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{selectedPersonnel.full_name}</div>
                  <div className="text-gray-500 text-xs">{selectedPersonnel.rank} • {selectedPersonnel.designation || "—"}</div>
                </div>
                <div className="ml-auto text-xs px-2 py-1 rounded border text-green-400 bg-green-600/10 border-green-600/30">
                  {format(new Date(), "h:mm a")} — Time of Arrival
                </div>
              </div>

              {/* Personnel Details */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Personnel Details
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
                    <div className="grid grid-cols-2 gap-4 w-full text-xs">
                      <div>
                        <span className="text-gray-600">Rank:</span>
                        <span className="text-white ml-2">{selectedPersonnel.rank}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duty Status:</span>
                        <span className="text-green-400 ml-2">{selectedPersonnel.duty_status}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Shift:</span>
                        <span className="text-white ml-2">{selectedPersonnel.shift || "—"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Certification:</span>
                        <span className="text-blue-400 ml-2">{selectedPersonnel.certification || "BFP"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Equipment */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  Serviceable Station Equipment ({relatedEquipment.length})
                </div>
                {relatedEquipment.length === 0 ? (
                  <div className="text-gray-600 text-xs py-3 text-center bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
                    No serviceable equipment found for this station
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {relatedEquipment.map(eq => (
                      <div key={eq.id} className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg">
                        <Package className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-white text-xs font-medium truncate">{eq.equipment_name}</div>
                          <div className="text-gray-600 text-xs">Qty: {eq.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-between">
              <button
                onClick={() => setStep("select_responder")}
                className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirmCheckIn}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? "Checking In..." : "Confirm ACS Check-In"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
