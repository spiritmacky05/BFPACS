/**
 * pages/Profile.jsx
 * User profile — shows SuperAdmin-assigned details, self-edit, logout, quick links.
 */
import { useAuth } from '@/context/AuthContext/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Shield, ShieldCheck, Clock, CheckCircle,
  AlertTriangle, Settings, Users, BarChart2, Truck,
  ClipboardList, ChevronRight, UserCheck, Package, Droplets,
  Edit2, Check, X, Briefcase, Wrench, Users2, Phone, MapPin, LogOut
} from 'lucide-react';
import { usersApi } from '@/api/users/users';
import { stationsApi } from '@/api/stations/stations';
import { createPageUrl } from '@/utils';

const ROLE_LABELS = {
  superadmin: "Super Administrator",
  admin: "Administrator",
  user: "User"
};

const adminLinks = [
  { label: "Incidents", page: "Incidents", icon: AlertTriangle, desc: "Manage fire incidents" },
  { label: "Fleet", page: "Fleet", icon: Truck, desc: "Fleet & vehicle management" },
  { label: "Dispatch", page: "Dispatch", icon: ClipboardList, desc: "Dispatch operations" },
  { label: "Dashboard", page: "Dashboard", icon: BarChart2, desc: "System overview" },
];

const quickLinks = [
  { label: "Duty Personnel", page: "DutyPersonnel", icon: UserCheck, desc: "View on-duty personnel" },
  { label: "Equipment", page: "Equipment", icon: Package, desc: "Equipment inventory" },
  { label: "Hydrants", page: "Hydrants", icon: Droplets, desc: "Hydrant locations & status" },
];

const superAdminLinks = [
  { label: "User Management", page: "SuperAdmin", icon: Users, desc: "Manage users & roles" },
  { label: "Settings", page: "SuperAdmin", icon: Settings, desc: "System configuration" },
];

const ACS_STATUS_STYLES = {
  "ACS Activated": "bg-blue-900/30 text-blue-400 border-blue-700/40",
  "Responding": "bg-orange-900/30 text-orange-400 border-orange-700/40",
  "Deployed": "bg-red-900/30 text-red-400 border-red-700/40",
  "Serviceable": "bg-green-900/30 text-green-400 border-green-700/40",
  "Under Maintenance": "bg-gray-800 text-gray-500 border-gray-700",
};

export default function Profile() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [stationName, setStationName] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    usersApi.me().then(u => {
      setUser(u);
      setFormData(u || {});
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile data. Please refresh the page.");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user?.station_id) {
      stationsApi.getById(user.station_id)
        .then(s => setStationName(s?.station_name ?? null))
        .catch(() => {});
    }
  }, [user?.station_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  const isApproved = user?.approved;
  const role = user?.role;
  const isAdmin = role === "admin" || role === "superadmin";
  const isSuperAdmin = role === "superadmin";

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateMe({
        personnel_type: formData.personnel_type || null,
        type_of_vehicle: formData.type_of_vehicle || null,
        engine_number: formData.engine_number || null,
        plate_number: formData.plate_number || null,
        fire_truck_capacity: formData.fire_truck_capacity ? Number(formData.fire_truck_capacity) : null,
        city_fire_marshal: formData.city_fire_marshal || null,
        station_commander: formData.station_commander || null,
        station_contact_number: formData.station_contact_number || null,
      });
      setUser(updated);
      setFormData(updated);
      setIsEditing(false);
    } catch {
      // handle error silently
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-red-600/20 border border-red-600/40 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold">{user?.full_name || "—"}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                role === "superadmin" ? "bg-purple-900/30 text-purple-400 border-purple-700/40" :
                role === "admin" ? "bg-red-900/30 text-red-400 border-red-700/40" :
                "bg-gray-800 text-gray-400 border-gray-700"
              }`}>
                {ROLE_LABELS[role] || "User"}
              </span>
              {user?.acs_status && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${ACS_STATUS_STYLES[user.acs_status] || ACS_STATUS_STYLES["Under Maintenance"]}`}>
                  {user.acs_status}
                </span>
              )}
              {stationName && (
                <span className="text-xs font-medium px-2 py-1 rounded-full border bg-blue-900/20 text-blue-400 border-blue-700/30">
                  {stationName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Approval Status */}
        <div className={`mt-5 flex items-center gap-3 p-4 rounded-lg border ${
          isApproved
            ? "bg-green-900/10 border-green-900/30"
            : "bg-yellow-900/10 border-yellow-900/30"
        }`}>
          {isApproved
            ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
            : <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
          }
          <div>
            <div className={`text-sm font-medium ${isApproved ? "text-green-400" : "text-yellow-400"}`}>
              {isApproved ? "Account Approved" : "Pending Approval"}
            </div>
            <div className="text-xs text-gray-500">
              {isApproved
                ? "Your account has been verified and is active."
                : "A SuperAdmin must approve your account before you can access all features."}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Section */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Details</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 border border-red-800/40 hover:bg-red-900/40 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Personnel Type</label>
                <select
                  value={formData.personnel_type || "BFP"}
                  onChange={(e) => setFormData({...formData, personnel_type: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                >
                  <option value="BFP">BFP</option>
                  <option value="Fire Brigade">Fire Brigade</option>
                  <option value="Fire Volunteer">Fire Volunteer</option>
                  <option value="PNP">PNP</option>
                  <option value="DRRMO">DRRMO</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Type of Vehicle</label>
                <input
                  type="text"
                  value={formData.type_of_vehicle || ""}
                  onChange={(e) => setFormData({...formData, type_of_vehicle: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                  placeholder="e.g., Pumper"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Engine Number</label>
                <input
                  type="text"
                  value={formData.engine_number || ""}
                  onChange={(e) => setFormData({...formData, engine_number: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                  placeholder="e.g., ENG-01"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Plate Number</label>
                <input
                  type="text"
                  value={formData.plate_number || ""}
                  onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                  placeholder="e.g., ABC-1234"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Fire Truck Capacity</label>
                <input
                  type="number"
                  value={formData.fire_truck_capacity || ""}
                  onChange={(e) => setFormData({...formData, fire_truck_capacity: e.target.value ? Number(e.target.value) : null})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">City Fire Marshal</label>
                <input
                  type="text"
                  value={formData.city_fire_marshal || ""}
                  onChange={(e) => setFormData({...formData, city_fire_marshal: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Station Commander</label>
                <input
                  type="text"
                  value={formData.station_commander || ""}
                  onChange={(e) => setFormData({...formData, station_commander: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Station Contact Number</label>
                <input
                  type="text"
                  value={formData.station_contact_number || ""}
                  onChange={(e) => setFormData({...formData, station_contact_number: e.target.value})}
                  className="w-full bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white focus:border-red-600/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-[#2f2f2f]">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(user || {});
                }}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-[#0d0d0d] text-gray-400 border border-[#2f2f2f] hover:border-gray-600 transition-all"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Briefcase, label: "Personnel Type", value: user?.personnel_type },
              { icon: Wrench, label: "Vehicle Type", value: user?.type_of_vehicle },
              { icon: ClipboardList, label: "Engine Number", value: user?.engine_number },
              { icon: MapPin, label: "Plate Number", value: user?.plate_number },
              { icon: Truck, label: "Truck Capacity", value: user?.fire_truck_capacity },
              { icon: Shield, label: "City Fire Marshal", value: user?.city_fire_marshal },
              { icon: Users2, label: "Station Commander", value: user?.station_commander },
              { icon: Phone, label: "Contact Number", value: user?.station_contact_number },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-4 bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg hover:border-red-600/40 hover:bg-red-900/10 transition-all">
                <Icon className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <div className="text-gray-600 text-xs uppercase tracking-widest">{label}</div>
                  <div className="text-white text-sm font-medium">{value || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-900/20 text-red-400 border border-red-800/40 hover:bg-red-900/40 transition-all font-medium text-sm"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      {/* Quick Links */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCheck className="w-4 h-4 text-red-400" />
          <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Quick Access</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map(({ label, page, icon: Icon, desc }) => (
            <Link
              key={page}
              to={createPageUrl(page)}
              className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg hover:border-red-600/40 hover:bg-red-900/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-red-400" />
                <div>
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-gray-600 text-xs">{desc}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Admin Panel Access */}
      {isAdmin && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-red-400" />
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest">Admin Functions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adminLinks.map(({ label, page, icon: Icon, desc }) => (
              <Link
                key={page + label}
                to={createPageUrl(page)}
                className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg hover:border-red-600/40 hover:bg-red-900/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-gray-600 text-xs">{desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SuperAdmin Panel */}
      {isSuperAdmin && (
        <div className="bg-[#111] border border-purple-900/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-semibold text-sm uppercase tracking-widest">SuperAdmin Functions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {superAdminLinks.map(({ label, page, icon: Icon, desc }) => (
              <Link
                key={label}
                to={createPageUrl(page)}
                className="flex items-center justify-between p-4 bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg hover:border-purple-600/40 hover:bg-purple-900/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-gray-600 text-xs">{desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}