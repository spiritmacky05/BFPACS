/**
 * StatusHistoryPanel
 *
 * Shows the status timeline for an incident using check-in logs and dispatch data.
 * Adapted from bfpacs_update — uses our checkinApi and dispatchesApi instead of base44.
 */

import { useState, useEffect } from "react";
import { checkinApi } from "@/features/checkin";
import { format, isValid } from "date-fns";

const statusColors = {
  Active: "text-red-400 bg-red-600/10 border-red-600/30",
  Controlled: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  "Fire Out": "text-blue-400 bg-blue-600/10 border-blue-600/30",
  Done: "text-gray-400 bg-gray-600/10 border-gray-600/30",
};

const safeFormat = (date, formatStr) => {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return format(d, formatStr);
};

export default function StatusHistoryPanel({ incidentId, incident }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;

    const fetchLogs = async () => {
      try {
        const checkinLogs = await checkinApi.getLogsForIncident(incidentId);

        // Build a timeline from the incident data itself + check-in events
        const timeline = [];

        // Add incident creation as first event
        if (incident?.date_time_reported) {
          timeline.push({
            id: "reported",
            status: "Active",
            timestamp: incident.date_time_reported,
            alarm_status: incident.alarm_status,
            ground_commander: incident.ground_commander,
            ics_commander: incident.ics_commander,
            detail: "Incident reported",
          });
        }

        // Add check-in events
        if (checkinLogs && checkinLogs.length > 0) {
          checkinLogs.forEach((log) => {
            timeline.push({
              id: log.id,
              status: "Check-In",
              timestamp: log.check_in_time,
              detail: `${log.personnel?.full_name || "Personnel"} checked in via ${log.check_in_method}`,
              check_in_method: log.check_in_method,
            });
          });
        }

        // Add status transitions if available
        if (incident?.incident_status === "Controlled" || incident?.incident_status === "Fire Out" || incident?.incident_status === "Done") {
          timeline.push({
            id: "controlled",
            status: "Controlled",
            timestamp: incident.updated_at,
            detail: "Incident marked as controlled",
          });
        }

        if (incident?.incident_status === "Fire Out" || incident?.incident_status === "Done") {
          timeline.push({
            id: "fireout",
            status: "Fire Out",
            timestamp: incident.updated_at,
            detail: "Fire out confirmed",
          });
        }

        if (incident?.incident_status === "Done") {
          timeline.push({
            id: "done",
            status: "Done",
            timestamp: incident.updated_at,
            detail: "Incident closed",
          });
        }

        // Sort by timestamp ascending
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLogs(timeline);
      } catch (error) {
        console.error("Error fetching status history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [incidentId, incident]);

  if (loading) return <div className="text-gray-600 text-sm">Loading history...</div>;

  if (!logs.length) return <div className="text-gray-600 text-sm">No status changes recorded yet.</div>;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded border font-semibold ${statusColors[log.status] || "text-green-400 bg-green-600/10 border-green-600/30"}`}>
              {log.status}
            </span>
            <span className="text-xs text-gray-500">
              {safeFormat(log.timestamp, "MMM d, yyyy h:mm a")}
            </span>
          </div>
          {log.detail && (
            <div className="text-xs text-gray-400 mb-1">{log.detail}</div>
          )}
          {log.alarm_status && (
            <div className="text-xs text-gray-500 mb-1">
              Alarm: <span className="text-orange-400">{log.alarm_status}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {log.ground_commander && (
              <div className="text-gray-600">Ground: <span className="text-gray-400">{log.ground_commander}</span></div>
            )}
            {log.ics_commander && (
              <div className="text-gray-600">ICS: <span className="text-gray-400">{log.ics_commander}</span></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
