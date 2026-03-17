import { useState, useEffect } from "react";
import { X, Save, CheckCircle, Clock } from "lucide-react";
import { stationsApi } from "@/features/stations";
import { personnelApi } from "@/features/personnel";
import { ACS_STATUSES } from "@/features/shared/components/acsStatus";

const ROLE_OPTIONS = ["user", "admin", "superadmin"];
const USER_TYPE_OPTIONS = ["responder", "manager"];
const SUB_ROLE_OPTIONS = {
  responder: [
    { value: "fire_suppression", label: "Fire Suppression (BFP)" },
    { value: "ems", label: "EMS (BFP)" },
    { value: "srf", label: "SRF (BFP)" },
    { value: "iiu", label: "IIU (BFP)" },
    { value: "fire_brigade", label: "Fire Brigade" },
    { value: "fire_volunteer", label: "Fire Volunteer" },
    { value: "drrmo", label: "DRRMO" },
    { value: "pnp", label: "PNP" },
    { value: "others", label: "Others" },
  ],
  manager: [
    { value: "finsp", label: "FINSP" },
    { value: "fsinsp", label: "FSINSP" },
    { value: "fcinsp", label: "FCINSP" },
    { value: "fsupt", label: "FSUPT" },
    { value: "fssupt", label: "FSSUPT" },
    { value: "fcsupt", label: "FCSUPT" },
  ],
};

const PERSONNEL_TYPES = ["BFP", "Fire Brigade", "Fire Volunteer", "PNP", "DRRMO"];

const inputClass =
  "w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50";
const selectClass =
  "w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50";
const labelClass = "text-xs text-gray-500 block mb-2";

export default function UserEditModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    role: (user.role || "user").toLowerCase(),
    user_type: user.user_type || "",
    sub_role: user.sub_role || "",
    approved: user.approved || false,
    personnel_type: user.personnel_type || "BFP",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationList, personnelList] = await Promise.all([
          stationsApi.list(),
          personnelApi.list(),
        ]);
        setStations(stationList || []);
        // Find personnel linked to this user by matching name or station
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
      personnel_type: form.personnel_type || null,
      type_of_vehicle: form.type_of_vehicle || null,
      engine_number: form.engine_number || null,
      plate_number: form.plate_number || null,
      fire_truck_capacity: form.fire_truck_capacity !== "" ? Number(form.fire_truck_capacity) : null,
      city_fire_marshal: form.city_fire_marshal || null,
      station_commander: form.station_commander || null,
      station_contact_number: form.station_contact_number || null,
      acs_status: form.acs_status,
      station_id: form.station_id || "",
    };
    if (form.role === "user") {
      payload.user_type = form.user_type || null;
      payload.sub_role = form.sub_role || null;
    } else {
      payload.user_type = null;
      payload.sub_role = null;
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
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value, user_type: "", sub_role: "" })
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

          {/* User Type & Sub Role */}
          {form.role === "user" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                  Type
                </label>
                <select
                  value={form.user_type}
                  onChange={(e) =>
                    setForm({ ...form, user_type: e.target.value, sub_role: "" })
                  }
                  className={selectClass}
                >
                  <option value="">Select Type</option>
                  {USER_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {form.user_type && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
                    Sub-Role
                  </label>
                  <select
                    value={form.sub_role}
                    onChange={(e) => setForm({ ...form, sub_role: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select Sub-Role</option>
                    {(SUB_ROLE_OPTIONS[form.user_type] || []).map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
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

          {/* Station Assignment */}
          <div className="border-t border-[#2f2f2f] pt-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
              Station Assignment
            </h3>
            <select
              value={form.station_id || ""}
              onChange={(e) => setForm({ ...form, station_id: e.target.value })}
              className={selectClass}
            >
              <option value="">Select Station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.station_name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          {/* User Vehicle & Station Info */}
          <div className="border-t border-[#2f2f2f] pt-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
              User Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Personnel Type</label>
                <select
                  value={form.personnel_type || "BFP"}
                  onChange={(e) => setForm({ ...form, personnel_type: e.target.value })}
                  className={selectClass}
                >
                  {PERSONNEL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Type of Vehicle</label>
                <input
                  type="text"
                  value={form.type_of_vehicle}
                  onChange={(e) => setForm({ ...form, type_of_vehicle: e.target.value })}
                  placeholder="e.g., Pumper, Ladder, Tanker"
                  className={inputClass}
                />
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
                <label className={labelClass}>Fire Truck Capacity</label>
                <input
                  type="number"
                  value={form.fire_truck_capacity}
                  onChange={(e) =>
                    setForm({ ...form, fire_truck_capacity: e.target.value })
                  }
                  placeholder="Personnel capacity"
                  className={inputClass}
                />
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
