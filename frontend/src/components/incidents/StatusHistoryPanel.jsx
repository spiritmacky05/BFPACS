import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Activity } from "lucide-react";

const statusColors = {
  Active: "text-red-400 bg-red-600/10 border-red-600/30",
  Controlled: "text-yellow-400 bg-yellow-600/10 border-yellow-600/30",
  "Fire Out": "text-blue-400 bg-blue-600/10 border-blue-600/30",
  Closed: "text-gray-400 bg-gray-600/10 border-gray-600/30",
};

export default function StatusHistoryPanel({ incidentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    base44.entities.IncidentStatusLog.filter(
      { incident_id: incidentId },
      "timestamp",
      100
    ).then(data => {
      setLogs(data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
      setLoading(false);
    });
  }, [incidentId]);

  if (loading) return <div className="text-gray-600 text-sm">Loading history...</div>;

  if (!logs.length) return <div className="text-gray-600 text-sm">No status changes recorded yet.</div>;

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded border font-semibold ${statusColors[log.status] || "text-gray-400"}`}>
              {log.status}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
            </span>
          </div>
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