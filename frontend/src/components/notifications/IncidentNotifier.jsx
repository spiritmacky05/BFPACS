import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

const alarmColors = {
  "1st Alarm": "text-yellow-400",
  "2nd Alarm": "text-orange-400",
  "3rd Alarm": "text-red-400",
  "General Alarm": "text-red-600",
};

export default function IncidentNotifier({ onUpdate }) {
  const knownIds = useRef(new Set());
  const knownStatuses = useRef({});

  useEffect(() => {
    // Seed known incidents silently on first load
    base44.entities.Incident.list("-reported_at", 100).then(incidents => {
      incidents.forEach(i => {
        knownIds.current.add(i.id);
        knownStatuses.current[i.id] = i.status;
      });
    });

    const unsub = base44.entities.Incident.subscribe((event) => {
      if (event.type === "create" && !knownIds.current.has(event.id)) {
        knownIds.current.add(event.id);
        const inc = event.data;
        if (inc) {
          knownStatuses.current[inc.id] = inc.status;
          toast.custom(() => (
            <div className="bg-[#1a0a0a] border border-red-700/60 rounded-xl px-4 py-3 flex items-start gap-3 shadow-xl max-w-sm">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0 animate-pulse" />
              <div>
                <div className="text-white font-semibold text-sm">New Incident Reported</div>
                <div className={`text-xs font-medium ${alarmColors[inc.alarm_level] || "text-gray-400"}`}>{inc.alarm_level} — {inc.incident_type}</div>
                <div className="text-gray-400 text-xs mt-0.5">{inc.location_address}</div>
              </div>
            </div>
          ), { duration: 6000 });
        }
      }

      if (event.type === "update" && event.data) {
        const inc = event.data;
        const prevStatus = knownStatuses.current[inc.id];
        if (prevStatus && prevStatus !== inc.status) {
          knownStatuses.current[inc.id] = inc.status;
          toast.custom(() => (
            <div className="bg-[#111] border border-yellow-700/50 rounded-xl px-4 py-3 flex items-start gap-3 shadow-xl max-w-sm">
              <RefreshCw className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-white font-semibold text-sm">Incident Status Updated</div>
                <div className="text-gray-300 text-xs">{inc.incident_type} — {inc.location_address}</div>
                <div className="text-yellow-400 text-xs mt-0.5">{prevStatus} → {inc.status}</div>
              </div>
            </div>
          ), { duration: 5000 });
        } else {
          knownStatuses.current[inc.id] = inc.status;
        }
      }

      if (onUpdate) onUpdate();
    });

    return () => unsub();
  }, []);

  return null;
}