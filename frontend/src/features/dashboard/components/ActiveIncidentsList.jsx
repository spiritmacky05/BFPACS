import { AlertTriangle, MapPin, Clock, Map as MapIcon } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const alarmColors = {
  "1st Alarm": "text-yellow-400 border-yellow-600/40 bg-yellow-600/10",
  "2nd Alarm": "text-orange-400 border-orange-600/40 bg-orange-600/10",
  "3rd Alarm": "text-red-400 border-red-600/40 bg-red-600/10",
  "General Alarm": "text-red-300 border-red-500/60 bg-red-600/20",
};

export default function ActiveIncidentsList({ incidents, selectedIncident, onSelect }) {
  const navigate = useNavigate();

  const handleClick = (inc) => {
    // Select for map preview
    onSelect(inc);
    // Navigate to full incident detail
    navigate(createPageUrl(`IncidentDetail?id=${inc.id}`));
  };

  if (!incidents?.length) {
    return (
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Active Incidents
        </h3>
        <p className="text-gray-600 text-sm text-center py-8">No active incidents</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" /> Active Incidents
        <span className="ml-auto bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full border border-red-600/30">
          {incidents.length} LIVE
        </span>
      </h3>
      <div className="space-y-3">
        {incidents.map(inc => (
          <button
            key={inc.id}
            onClick={() => handleClick(inc)}
            className={`w-full text-left border rounded-lg p-3 transition-all ${
              selectedIncident?.id === inc.id
                ? "border-red-600/60 bg-red-600/10"
                : "border-[#1f1f1f] hover:border-red-600/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-white text-sm font-medium">{inc.response_type || inc.occupancy_type || 'Unknown'}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${alarmColors[inc.alarm_status] || alarmColors["1st Alarm"]}`}>
                {inc.alarm_status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <MapPin className="w-3 h-3" />
              <span>{inc.location_text}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              {inc.date_time_reported && (
                <div className="flex items-center gap-1 text-gray-600 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(inc.date_time_reported), "MMM d, h:mm a")}</span>
                </div>
              )}
              {inc.lat && inc.lng && (
                <div className="flex items-center gap-1 text-blue-400 text-xs">
                  <MapIcon className="w-3 h-3" />
                  <span>View Map</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
