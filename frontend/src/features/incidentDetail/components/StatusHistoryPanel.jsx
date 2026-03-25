/**
 * StatusHistoryPanel
 *
 * Shows the simplified activity timeline for an incident using the status_history from backend.
 */

import { useState } from "react";
import { format, isValid } from "date-fns";

const safeFormat = (date, formatStr) => {
  if (!date) return "—";
  const d = new Date(date);
  if (!isValid(d)) return "—";
  return format(d, formatStr);
};

export default function StatusHistoryPanel({ incident }) {
  const statusHistory = incident?.status_history || [];

  if (!statusHistory.length) {
    return (
      <div className="text-center py-10">
        <div className="text-gray-600 text-sm">No activity recorded yet.</div>
      </div>
    );
  }

  // Sort by timestamp descending for the UI so latest is on top
  const sorted = [...statusHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-0 pt-2">
      {sorted.map((log, i) => (
        <div key={i} className="flex gap-4 group">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-red-600/40 border border-red-600/60 mt-1.5" />
            {i !== sorted.length - 1 && <div className="flex-1 w-px bg-[#1f1f1f] my-1" />}
          </div>
          <div className="flex-1 pb-6">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
              {safeFormat(log.timestamp, "MMM d, h:mm a")}
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">
              {log.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
