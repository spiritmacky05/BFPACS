import { useState, useEffect } from "react";
import { X, Save, CheckCircle, Clock } from "lucide-react";
import { stationsApi } from "@/features/stations";
import { personnelApi } from "@/features/personnel";
import { ACS_STATUSES } from "@/features/shared/components/acsStatus";

const ROLE_OPTIONS = ["user", "admin", "superadmin"];
const SUB_USER_ROLE_OPTIONS = ["responder", "manager"];
const AGENCY_ROLE_OPTIONS = ["BFP", "Fire Volunteer", "Fire Brigade", "PNP", "DRRMO", "Others"];
const BFP_TYPE_OPTIONS = ["Fire Suppression", "EMS", "IIU", "SRF"];
const CAPACITY_OPTIONS = [250, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
const VEHICLE_TYPE_OPTIONS = [
  "Pumper",
  "Water Tanker",
  "Aerial Ladder",
  "Aerial Platform",
  "Rescue Vehicle",
  "Ambulance",
  "Command Vehicle",
  "Service Vehicle",
  "Squirt",
  "Fire Boat",
  "Crash Fire Rescue (CFR)"
];

// Explicit no-tank list from configured vehicle options.
const NO_TANK_VEHICLE_TYPES = new Set([
  "Aerial Ladder",
  "Aerial Platform",
  "Rescue Vehicle",
  "Ambulance",
  "Command Vehicle",
  "Service Vehicle",
]);

function hasTankByVehicleType(vehicleType) {
  // Default to tank-capable unless explicitly listed as no-tank.
  if (!vehicleType) return true;
  return !NO_TANK_VEHICLE_TYPES.has(vehicleType);
}

const inputClass =
  "w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50";
const selectClass =
  "w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50";
const labelClass = "text-xs text-gray-500 block mb-2";

export default function UserEditModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    role: (user.role || "user").toLowerCase(),
    sub_user_role: user.sub_user_role || "",
    agency_role: user.agency_role || "",
    bfp_type: user.bfp_type || "",
    manager_rank: user.manager_rank || "",
    approved: user.approved || false,
    type_of_vehicle: user.type_of_vehicle || "",
    engine_number: user.engine_number || "",
    plate_number: user.plate_number || "",
    fire_truck_capacity: user.fire_truck_capacity ?? "",
    city_fire_marshal: user.city_fire_marshal || "",
    station_commander: user.station_commander || "",
    station_contact_number: user.station_contact_number || "",
    acs_status: user.acs_status || "Serviceable",
    station_id: user.station_id || "",
  });
  const [stations, setStations] = useState([]);
  const [personnel, setPersonnel] = useState(null);
  const isTankCapableVehicle = hasTankByVehicleType(form.type_of_vehicle);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationList, personnelList] = await Promise.all([
          stationsApi.list(),
          personnelApi.list(),
        ]);
        setStations(stationList || []);
        const linked = (personnelList || []).find(
          (p) => p.station_id === user.station_id
        );
        setPersonnel(linked || null);
      } catch (err) {
        console.warn("Failed to load supporting data:", err);
      }
    };
    fetchData();
  }, [user.id]);

  const handleSave = () => {
    const payload = {
      role: form.role.toLowerCase(),
      approved: form.approved,
      type_of_vehicle: form.type_of_vehicle || null,
      engine_number: form.engine_number || null,
      plate_number: form.plate_number || null,
      fire_truck_capacity:
        isTankCapableVehicle && form.fire_truck_capacity !== ""
          ? Number(form.fire_truck_capacity)
          : null,
      city_fire_marshal: form.city_fire_marshal || null,
      station_commander: form.station_commander || null,
      station_contact_number: form.station_contact_number || null,
      acs_status: form.acs_status,
      station_id: form.station_id || "",
    };

    if (form.role === "user") {
      payload.sub_user_role = form.sub_user_role || null;
      if (form.sub_user_role === "responder") {
        payload.agency_role = form.agency_role || null;
        if (form.agency_role === "BFP") {
          payload.bfp_type = form.bfp_type || null;
        } else {
          payload.bfp_type = null;
        }
        payload.manager_rank = null;
      } else if (form.sub_user_role === "manager") {
        payload.manager_rank = form.manager_rank || null;
        payload.agency_role = null;
        payload.bfp_type = null;
      } else {
        payload.agency_role = null;
        payload.bfp_type = null;
        payload.manager_rank = null;
      }
    } else {
      payload.sub_user_role = null;
      payload.agency_role = null;
      payload.bfp_type = null;
      payload.manager_rank = null;
    }

    onSave(user.id, payload, personnel);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f] shrink-0">
          <div>
            <h2 className="text-white font-semibold text-lg">{user.full_name}</h2>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Role Selection */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Top-Level Role
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value, sub_user_role: "", agency_role: "", bfp_type: "", manager_rank: "" })
              }
              className={selectClass}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-User Logic */}
          {form.role === "user" && (
            <div className="space-y-4 bg-[#1a1a1a]/30 p-4 rounded-lg border border-[#2f2f2f]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Sub-User Role
                  </label>
                  <select
                    value={form.sub_user_role}
                    onChange={(e) =>
                      setForm({ ...form, sub_user_role: e.target.value, agency_role: "", bfp_type: "", manager_rank: "" })
                    }
                    className={selectClass}
                  >
                    <option value="">Select Sub-Role</option>
                    {SUB_USER_ROLE_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {form.sub_user_role === "manager" && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                      Manager Rank
                    </label>
                    <select
                      value={form.manager_rank}
                      onChange={(e) => setForm({ ...form, manager_rank: e.target.value })}
                      className={selectClass}
                    >
                      <option value="">Select Rank</option>
                      <option value="FO1">FO1</option>
                      <option value="FO2">FO2</option>
                      <option value="FO3">FO3</option>
                      <option value="SFO1">SFO1</option>
                      <option value="SFO2">SFO2</option>
                      <option value="SFO3">SFO3</option>
                      <option value="SFO4">SFO4</option>
                      <option value="FSINP">FSINP</option>
                      <option value="FSINSP">FSINSP</option>
                      <option value="FCINSP">FCINSP</option>
                      <option value="FSUPT">FSUPT</option>
                      <option value="FSSUPT">FSSUPT</option>
                      <option value="FCSUPT">FCSUPT</option>
                    </select>
                  </div>
                )}
              </div>

              {form.sub_user_role === "responder" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                      Agency Role
                    </label>
                    <select
                      value={form.agency_role}
                      onChange={(e) => setForm({ ...form, agency_role: e.target.value, bfp_type: "" })}
                      className={selectClass}
                    >
                      <option value="">Select Agency</option>
                      {AGENCY_ROLE_OPTIONS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  {form.agency_role === "BFP" && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                        BFP Type
                      </label>
                      <select
                        value={form.bfp_type}
                        onChange={(e) => setForm({ ...form, bfp_type: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Select BFP Type</option>
                        {BFP_TYPE_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approval Status */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Status
            </label>
            <button
              onClick={() => setForm({ ...form, approved: !form.approved })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                form.approved
                  ? "bg-green-900/20 text-green-400 border-green-800/40"
                  : "bg-yellow-900/10 text-yellow-500 border-yellow-800/30"
              }`}
            >
              {form.approved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {form.approved ? "Approved" : "Pending"}
            </button>
          </div>

          {/* Global Fields */}
          <div className="border-t border-[#2f2f2f] pt-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
              Global Vehicle & Station Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type of Vehicle</label>
                <select
                  value={form.type_of_vehicle}
                  onChange={(e) => {
                    const nextVehicleType = e.target.value;
                    const nextIsTankCapable = hasTankByVehicleType(nextVehicleType);
                    setForm({
                      ...form,
                      type_of_vehicle: nextVehicleType,
                      fire_truck_capacity: nextIsTankCapable ? form.fire_truck_capacity : "",
                    });
                  }}
                  className={selectClass}
                >
                  <option value="">Select Vehicle Type</option>
                  {VEHICLE_TYPE_OPTIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Engine Number</label>
                <input
                  type="text"
                  value={form.engine_number}
                  onChange={(e) => setForm({ ...form, engine_number: e.target.value })}
                  placeholder="Engine number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Plate Number</label>
                <input
                  type="text"
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                  placeholder="Plate number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Fire Truck Capacity (Gallons)</label>
                <select
                  value={form.fire_truck_capacity}
                  onChange={(e) => setForm({ ...form, fire_truck_capacity: e.target.value })}
                  disabled={!isTankCapableVehicle}
                  className={`${selectClass} ${!isTankCapableVehicle ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {!isTankCapableVehicle ? (
                    <option value="">No tank</option>
                  ) : (
                    <>
                      <option value="">Select Capacity</option>
                      {CAPACITY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c} Gallons
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className={labelClass}>City Fire Marshal</label>
                <input
                  type="text"
                  value={form.city_fire_marshal}
                  onChange={(e) => setForm({ ...form, city_fire_marshal: e.target.value })}
                  placeholder="Name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Station Commander</label>
                <input
                  type="text"
                  value={form.station_commander}
                  onChange={(e) =>
                    setForm({ ...form, station_commander: e.target.value })
                  }
                  placeholder="Name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Station Contact Number</label>
                <input
                  type="tel"
                  value={form.station_contact_number}
                  onChange={(e) =>
                    setForm({ ...form, station_contact_number: e.target.value })
                  }
                  placeholder="Phone number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>ACS Status</label>
                <select
                  value={form.acs_status}
                  onChange={(e) => setForm({ ...form, acs_status: e.target.value })}
                  className={selectClass}
                >
                  {ACS_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#2f2f2f] text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
