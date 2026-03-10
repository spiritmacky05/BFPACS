/**
 * SuperAdmin.jsx — Full user management + system health.
 * Migrated from bfpacs_update, wired to the Go/Gin backend.
 */
import { useState, useEffect } from "react";
import {
  ShieldCheck, Search, CheckCircle,
  Edit2, Users, Clock, Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext/AuthContext";
import { usersApi } from "@/api/users/users";
import api from "@/api/client/client";
import UserEditModal from "@/components/superadmin/UserEditModal";

const ROLE_LABELS = {
  superadmin: {
    label: "SuperAdmin",
    color: "bg-purple-900/30 text-purple-400 border-purple-700/40",
  },
  admin: {
    label: "Admin",
    color: "bg-red-900/30 text-red-400 border-red-700/40",
  },
  user: {
    label: "User",
    color: "bg-gray-800 text-gray-400 border-gray-700",
  },
};

export default function SuperAdmin() {
  const { role } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (role === "superadmin") {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [role]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data || []);
    } catch (err) {
      console.warn("Could not load users:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickApprove = async (userId, approved) => {
    try {
      await usersApi.quickApprove(userId, approved);
      loadUsers();
    } catch (err) {
      console.error("Failed to update approval:", err);
    }
  };

  const saveUserEdit = async (userId, payload) => {
    setSaving(true);
    try {
      await usersApi.update(userId, payload);
      loadUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
      alert(`Failed to save user: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
      setEditingUser(null);
    }
  };

  // Guard: only superadmins
  if (!loading && role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ShieldCheck className="w-12 h-12 text-gray-700" />
        <div className="text-gray-500 text-sm">
          Access Denied — SuperAdmin only.
        </div>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" || (filter === "pending" && !u.approved);
    return matchSearch && matchFilter;
  });

  const pendingCount = users.filter((u) => !u.approved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          <div>
            <h1 className="text-white font-bold text-lg">Super Admin</h1>
            <p className="text-gray-600 text-xs">
              User management, roles, approvals, and system configuration
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-white">{users.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">
              Total
            </div>
          </div>
          <div className="bg-[#111] border border-yellow-900/30 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-yellow-400">
              {pendingCount}
            </div>
            <div className="text-xs text-yellow-600 uppercase tracking-widest">
              Pending
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1f1f1f] pb-0">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
            activeTab === "users"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Users className="w-4 h-4" /> User Management
        </button>
        <button
          onClick={() => {
            setActiveTab("system");
            if (!health) {
              api
                .get("/health")
                .then(setHealth)
                .catch(() => setHealth({ status: "unreachable" }));
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
            activeTab === "system"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <Activity className="w-4 h-4" /> System Health
        </button>
      </div>

      {/* ─── System Health Tab ─── */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" /> API Health
            </h3>
            {health ? (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${
                  health.status === "ok"
                    ? "bg-green-600/10 border-green-600/30"
                    : "bg-red-600/10 border-red-600/30"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    health.status === "ok" ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    health.status === "ok" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {health.status === "ok"
                    ? "API Online — BFPACS Backend Running"
                    : "API Unreachable"}
                </span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Checking...</div>
            )}
          </div>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
            <h3 className="text-white font-medium mb-3">Backend Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>API Base URL</span>
                <span className="text-gray-300 font-mono text-xs">
                  {(
                    import.meta.env.VITE_API_URL ||
                    "http://localhost:8080/api/v1"
                  ).replace(/\/api\/v1\/?$/, "")}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Framework</span>
                <span className="text-gray-300">Go / Gin</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Database</span>
                <span className="text-gray-300">PostgreSQL + PostGIS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── User Management Tab ─── */}
      {activeTab === "users" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-[#111] border border-[#1f1f1f] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-600/50"
              />
            </div>
            <div className="flex gap-2">
              {["all", "pending"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                    filter === f
                      ? "bg-purple-900/30 text-purple-400 border-purple-700/40"
                      : "bg-[#111] text-gray-500 border-[#1f1f1f] hover:border-gray-600"
                  }`}
                >
                  {f === "pending" ? `Pending (${pendingCount})` : "All Users"}
                </button>
              ))}
            </div>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-600 py-10 text-sm">
                Loading users...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-gray-600 py-10 text-sm">
                No users found.
              </div>
            ) : (
              filtered.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setEditingUser(u)}
                  className="w-full bg-[#111] border border-[#1f1f1f] hover:border-purple-600/40 rounded-xl p-4 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">
                          {u.full_name || "—"}
                        </div>
                        <div className="text-gray-500 text-xs">{u.email}</div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              ROLE_LABELS[u.role]?.color ||
                              ROLE_LABELS.user.color
                            }`}
                          >
                            {ROLE_LABELS[u.role]?.label || "User"}
                          </span>
                          {u.role === "user" && u.user_type && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-900/20 text-blue-400 border-blue-800/40 capitalize">
                              {u.user_type}
                            </span>
                          )}
                          {u.role === "user" && u.sub_role && (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-900/20 text-yellow-400 border-yellow-800/40 uppercase">
                              {u.sub_role.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!u.approved ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quickApprove(u.id, true);
                          }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-900/20 text-green-400 border border-green-800/40 hover:bg-green-900/40 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quickApprove(u.id, false);
                          }}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-900/10 text-yellow-500 border border-yellow-800/30 hover:bg-yellow-900/20 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* User Edit Modal */}
          {editingUser && (
            <UserEditModal
              user={editingUser}
              saving={saving}
              onClose={() => setEditingUser(null)}
              onSave={saveUserEdit}
            />
          )}
        </>
      )}
    </div>
  );
}
