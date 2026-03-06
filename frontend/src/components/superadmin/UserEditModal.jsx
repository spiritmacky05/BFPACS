import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, CheckCircle, Clock, Loader } from "lucide-react";

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
  ]
};

export default function UserEditModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    role: user.role || "user",
    user_type: user.user_type || "",
    sub_role: user.sub_role || "",
    approved: user.approved || false,
    personnel_type: user.personnel_type || "BFP",
    type_of_vehicle: user.type_of_vehicle || "",
    fire_truck_capacity: user.fire_truck_capacity || "",
    city_fire_marshal: user.city_fire_marshal || "",
    station_commander: user.station_commander || "",
    station_contact_number: user.station_contact_number || "",
  });
  const [personnel, setPersonnel] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, s] = await Promise.all([
          base44.entities.Personnel.filter({ user_id: user.id }),
          base44.entities.FireStation.list(),
        ]);
        setPersonnel(p[0] || null);
        setStations(s);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const handleSave = () => {
    onSave(user.id, { ...form, personnel_type: form.personnel_type }, personnel);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-white font-semibold text-lg">{user.full_name}</h2>
            <p className="text-gray-500 text-xs">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Role Selection */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value, user_type: "", sub_role: "" })}
              className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* User Type & Sub Role */}
          {form.role === "user" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Type</label>
                <select
                  value={form.user_type}
                  onChange={e => setForm({ ...form, user_type: e.target.value, sub_role: "" })}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
                >
                  <option value="">Select Type</option>
                  {USER_TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {form.user_type && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Sub-Role</label>
                  <select
                    value={form.sub_role}
                    onChange={e => setForm({ ...form, sub_role: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
                  >
                    <option value="">Select Sub-Role</option>
                    {(SUB_ROLE_OPTIONS[form.user_type] || []).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Approval Status */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Status</label>
            <button
              onClick={() => setForm({ ...form, approved: !form.approved })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                form.approved
                  ? "bg-green-900/20 text-green-400 border-green-800/40"
                  : "bg-yellow-900/10 text-yellow-500 border-yellow-800/30"
              }`}
            >
              {form.approved ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {form.approved ? "Approved" : "Pending"}
            </button>
          </div>

          {/* User Vehicle & Station Info */}
          <div className="border-t border-[#2f2f2f] pt-4">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">User Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-2">Role of User</label>
                <select
                  value={form.personnel_type || "BFP"}
                  onChange={e => setForm({ ...form, personnel_type: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
                >
                  <option value="BFP">BFP</option>
                  <option value="Fire Brigade">Fire Brigade</option>
                  <option value="Fire Volunteer">Fire Volunteer</option>
                  <option value="PNP">PNP</option>
                  <option value="DRRMO">DRRMO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Type of Vehicle</label>
                <input
                  type="text"
                  value={form.type_of_vehicle}
                  onChange={e => setForm({ ...form, type_of_vehicle: e.target.value })}
                  placeholder="e.g., Pumper, Ladder, Tanker"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Fire Truck Capacity</label>
                <input
                  type="number"
                  value={form.fire_truck_capacity}
                  onChange={e => setForm({ ...form, fire_truck_capacity: e.target.value })}
                  placeholder="Personnel capacity"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">City Fire Marshal</label>
                <input
                  type="text"
                  value={form.city_fire_marshal}
                  onChange={e => setForm({ ...form, city_fire_marshal: e.target.value })}
                  placeholder="Name"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Station Commander</label>
                <input
                  type="text"
                  value={form.station_commander}
                  onChange={e => setForm({ ...form, station_commander: e.target.value })}
                  placeholder="Name"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-2">Station Contact Number</label>
                <input
                  type="tel"
                  value={form.station_contact_number}
                  onChange={e => setForm({ ...form, station_contact_number: e.target.value })}
                  placeholder="Phone number"
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                />
              </div>
            </div>
          </div>

          {/* Station Information */}
          {personnel && (
            <>
              <div className="border-t border-[#2f2f2f] pt-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Station Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Fire Station</label>
                    <select
                      value={personnel.fire_station_id || ""}
                      onChange={e => setPersonnel({ ...personnel, fire_station_id: e.target.value })}
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
                    >
                      <option value="">Select Station</option>
                      {stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">District</label>
                    <input
                      type="text"
                      value={personnel.district || ""}
                      onChange={e => setPersonnel({ ...personnel, district: e.target.value })}
                      placeholder="District"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Region</label>
                    <input
                      type="text"
                      value={personnel.region || ""}
                      onChange={e => setPersonnel({ ...personnel, region: e.target.value })}
                      placeholder="Region"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">City</label>
                    <input
                      type="text"
                      value={personnel.city || ""}
                      onChange={e => setPersonnel({ ...personnel, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="border-t border-[#2f2f2f] pt-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Badge Number</label>
                    <input
                      type="text"
                      value={personnel.badge_number || ""}
                      onChange={e => setPersonnel({ ...personnel, badge_number: e.target.value })}
                      placeholder="Badge Number"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">NFC Tag ID</label>
                    <input
                      type="text"
                      value={personnel.nfc_tag_id || ""}
                      onChange={e => setPersonnel({ ...personnel, nfc_tag_id: e.target.value })}
                      placeholder="NFC Tag ID"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={personnel.contact_number || ""}
                      onChange={e => setPersonnel({ ...personnel, contact_number: e.target.value })}
                      placeholder="Contact Number"
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Personnel Type</label>
                    <select
                      value={personnel.personnel_type || "BFP"}
                      onChange={e => setPersonnel({ ...personnel, personnel_type: e.target.value })}
                      className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-purple-600/50"
                    >
                      <option value="BFP">BFP</option>
                      <option value="Fire Brigade">Fire Brigade</option>
                      <option value="Fire Volunteer">Fire Volunteer</option>
                      <option value="PNP">PNP</option>
                      <option value="DRRMO">DRRMO</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
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