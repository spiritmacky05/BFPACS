/**
 * pages/IncidentDetail.jsx
 *
 * Full incident report view — matches bfpacs_update design.
 * Shows: header, personnel breakdown, info sections, fleet, checked-in personnel,
 * checked-in equipment, status history, ACS portal, edit & close modals.
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertTriangle, ArrowLeft, Printer, Pencil, MapPin,
  Shield, Users, FileText, Activity, Lock, Wifi,
} from "lucide-react";
import { createPageUrl }    from "@/utils";
import { incidentsApi }     from "@/api/incidents/incidents";
import { dispatchesApi }    from "@/api/dispatches/dispatches";
import { fleetApi }         from "@/api/fleet/fleet";
import { useAuth }          from "@/context/AuthContext/AuthContext";
import IncidentEditModal              from "../../components/incidents/IncidentEditModal/IncidentEditModal";
import ConfirmationModal              from "../../components/common/ConfirmationModal/ConfirmationModal";
import StatusHistoryPanel             from "../../components/incidents/StatusHistoryPanel/StatusHistoryPanel";
import PersonnelBreakdownDashboard    from "../../components/incidents/PersonnelBreakdownDashboard/PersonnelBreakdownDashboard";
import FleetForIncidentDashboard      from "../../components/incidents/FleetForIncidentDashboard/FleetForIncidentDashboard";
import ACSCheckInPortal               from "../../components/incidents/ACSCheckInPortal/ACSCheckInPortal";
import CheckedInPersonnelList         from "../../components/incidents/CheckedInPersonnelList/CheckedInPersonnelList";
import CheckedInEquipmentList         from "../../components/incidents/CheckedInEquipmentList/CheckedInEquipmentList";

const statusColors = {
  Active:     "text-red-400 bg-red-600/10 border-red-600/30",
  Controlled: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  "Fire Out": "text-blue-400 bg-blue-600/10 border-blue-600/30",
  Done:       "text-gray-400 bg-gray-600/10 border-gray-600/30",
};

function InfoRow({ label, value, valueClass = "text-white" }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-[#1f1f1f] last:border-0">
      <span className="text-gray-500 text-xs uppercase tracking-wider w-48 shrink-0">{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function IncidentDetail() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const incidentId = params.get("id");

  const [incident,    setIncident]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showACSPortal, setShowACSPortal] = useState(false);
  const printRef = useRef();

  const { role } = useAuth();
  const isAdmin  = role === "admin" || role === "superadmin";

  // ── Data fetching ─────────────────────────────────────────────────────────
  const load = async () => {
    if (!incidentId) return;
    try {
      const data = await incidentsApi.getById(incidentId);
      setIncident(data || null);
    } catch {
      setIncident(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [incidentId]);

  // ── Close incident ────────────────────────────────────────────────────────
  const handleClose = async () => {
    if (!incident) return;
    try {
      await incidentsApi.updateStatus(incidentId, { incident_status: "Done" });

      // Release dispatched fleet back to Serviceable
      const dispatches = await dispatchesApi.getByIncident(incidentId);
      await Promise.all(
        (dispatches ?? []).map(d =>
          Promise.all([
            fleetApi.update(d.fleet_id, { status: "Serviceable" }),
            fleetApi.logMovement(d.fleet_id, { status_code: "Incident Closed — Returned to Service" }),
          ])
        )
      );

      setShowConfirm(false);
      load();
    } catch (error) {
      console.error("Error closing incident:", error);
      setShowConfirm(false);
    }
  };

  // ── Print / Export ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incident Report — ${incident?.id?.slice(0, 8) || ""}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
            .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
            .header-text h1 { font-size: 18px; font-weight: 700; color: #dc2626; }
            .header-text p { font-size: 12px; color: #555; margin-top: 2px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid; }
            .badge-active { color: #dc2626; border-color: #dc262660; background: #dc262610; }
            .badge-controlled { color: #ca8a04; border-color: #ca8a0460; background: #ca8a0410; }
            .badge-fireout { color: #2563eb; border-color: #2563eb60; background: #2563eb10; }
            .badge-done { color: #6b7280; border-color: #6b728060; background: #6b728010; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #dc2626; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
            .row { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f3f3; }
            .row:last-child { border-bottom: none; }
            .row-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; width: 180px; flex-shrink: 0; padding-top: 1px; }
            .row-value { font-size: 13px; color: #111; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-text">
              <h1>Bureau of Fire Protection</h1>
              <p>Automated Check-in System — Fire Incident Report</p>
            </div>
          </div>
          ${printContent}
          <div class="footer">
            <span>Generated: ${new Date().toLocaleString()}</span>
            <span>BFPACS — CONFIDENTIAL</span>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  // ── Loading / Not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">Loading incident data...</div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center text-gray-600 py-24">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-700" />
        <p>Incident not found.</p>
        <Link to={createPageUrl("Incidents")} className="text-red-400 text-sm mt-2 inline-block hover:underline">← Back to Incidents</Link>
      </div>
    );
  }

  // ── Printable content ─────────────────────────────────────────────────────
  const badgeClass = {
    Active: "badge-active", Controlled: "badge-controlled",
    "Fire Out": "badge-fireout", Done: "badge-done",
  }[incident.incident_status] || "badge-active";

  const printableContent = `
    <div class="section">
      <div class="section-title">Incident Information</div>
      <div class="row"><span class="row-label">Incident ID</span><span class="row-value">${incident.id?.slice(0, 8) || "—"}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value"><span class="badge ${badgeClass}">${incident.incident_status || "—"}</span></span></div>
      <div class="row"><span class="row-label">Alarm Status</span><span class="row-value">${incident.alarm_status || "—"}</span></div>
      <div class="row"><span class="row-label">Date & Time Reported</span><span class="row-value">${incident.date_time_reported ? format(new Date(incident.date_time_reported), "MMMM d, yyyy h:mm a") : "—"}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Location</div>
      <div class="row"><span class="row-label">Address</span><span class="row-value">${incident.location_text || "—"}</span></div>
      ${incident.occupancy_type ? `<div class="row"><span class="row-label">Type of Occupancy</span><span class="row-value">${incident.occupancy_type}</span></div>` : ""}
    </div>
    <div class="section">
      <div class="section-title">Command</div>
      <div class="row"><span class="row-label">Ground Commander</span><span class="row-value">${incident.ground_commander || "—"}</span></div>
      <div class="row"><span class="row-label">ICS Commander</span><span class="row-value">${incident.ics_commander || "—"}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Casualties</div>
      <div class="row"><span class="row-label">Injured</span><span class="row-value">${incident.total_injured ?? "—"}</span></div>
      <div class="row"><span class="row-label">Rescued</span><span class="row-value">${incident.total_rescued ?? "—"}</span></div>
    </div>
  `;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to={createPageUrl("Incidents")} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Incidents
        </Link>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-red-600/40 text-sm transition-all">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {isAdmin && incident.incident_status !== "Done" && (
            <button onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600/40 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-all">
              <Lock className="w-4 h-4" /> Close Incident
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowACSPortal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-600/40 text-green-400 hover:bg-green-600/10 text-sm transition-all">
              <Wifi className="w-4 h-4" /> ACS Portal
            </button>
          )}
          {isAdmin && (
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-all">
              <Printer className="w-4 h-4" /> Print / Export
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1 font-mono">{incident.id?.slice(0, 8)}</div>
            <h1 className="text-xl font-bold text-white">{incident.location_text}</h1>
            {incident.occupancy_type && (
              <div className="text-sm text-gray-500 mt-1">{incident.occupancy_type}</div>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`text-xs px-3 py-1 rounded border font-semibold ${statusColors[incident.incident_status] || statusColors.Active}`}>
              {incident.incident_status}
            </span>
            {incident.alarm_status && (
              <span className="text-xs px-3 py-1 rounded border text-orange-400 border-orange-600/40 bg-orange-600/10">
                {incident.alarm_status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personnel Asset Dashboard */}
      <PersonnelBreakdownDashboard incidentId={incidentId} />

      {/* Details Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incident Info */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
            <Activity className="w-3.5 h-3.5" /> Incident Info
          </div>
          <div>
            <InfoRow label="Reported At" value={incident.date_time_reported ? format(new Date(incident.date_time_reported), "MMM d, yyyy h:mm a") : null} />
            <InfoRow label="Response Type" value={incident.response_type} />
            <InfoRow label="Alarm Status" value={incident.alarm_status} valueClass="text-orange-400" />
          </div>
        </div>

        {/* Location */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
            <MapPin className="w-3.5 h-3.5" /> Location
          </div>
          <div>
            <InfoRow label="Address" value={incident.location_text} />
            <InfoRow label="Type of Occupancy" value={incident.occupancy_type} />
            {incident.lat && incident.lng && (
              <InfoRow label="Coordinates" value={`${incident.lat}, ${incident.lng}`} valueClass="text-gray-400 font-mono text-xs" />
            )}
          </div>
        </div>

        {/* Command */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" /> Command
          </div>
          <div>
            <InfoRow label="Ground Commander" value={incident.ground_commander} />
            <InfoRow label="ICS Commander" value={incident.ics_commander} />
            {!incident.ground_commander && !incident.ics_commander && (
              <p className="text-gray-700 text-xs">No command data recorded.</p>
            )}
          </div>
        </div>

        {/* Casualties */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
            <Users className="w-3.5 h-3.5" /> Casualties
          </div>
          <div className="flex gap-6 mt-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{incident.total_injured ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">Injured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{incident.total_rescued ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">Rescued</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Asset Dashboard */}
      <FleetForIncidentDashboard incidentId={incidentId} />

      {/* Checked-In Personnel */}
      <CheckedInPersonnelList incidentId={incidentId} />

      {/* Checked-In Equipment */}
      <CheckedInEquipmentList incidentId={incidentId} />

      {/* Printable content (hidden visually, used for print) */}
      <div ref={printRef} style={{ display: "none" }} dangerouslySetInnerHTML={{ __html: printableContent }} />

      {/* Status History */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold mb-4">
          <Activity className="w-3.5 h-3.5" /> Status History
        </div>
        <StatusHistoryPanel incidentId={incidentId} incident={incident} />
      </div>

      {/* ACS Portal Modal */}
      {showACSPortal && (
        <ACSCheckInPortal
          incidentId={incidentId}
          onClose={() => setShowACSPortal(false)}
          onCheckInComplete={() => { setShowACSPortal(false); load(); }}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <ConfirmationModal
          title="Close Incident"
          message="Are you sure you want to close this incident? This will move it to the archive."
          confirmText="Close Incident"
          isDangerous={true}
          onConfirm={handleClose}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <IncidentEditModal
          incident={incident}
          onClose={() => setEditing(false)}
          onSaved={() => { load(); setEditing(false); }}
        />
      )}
    </div>
  );
}