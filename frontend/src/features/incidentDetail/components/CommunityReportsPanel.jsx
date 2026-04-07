// @ts-nocheck
import { useEffect, useState } from 'react';
import { MessageCircleWarning, MapPin, Camera } from 'lucide-react';
import { communityApi } from '@/features/community';

export default function CommunityReportsPanel({ incidentId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await communityApi.listReportsByIncident(incidentId);
        if (!cancelled) setReports(data || []);
      } catch {
        if (!cancelled) setReports([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [incidentId]);

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center gap-2 text-xs text-amber-400 uppercase tracking-widest font-semibold mb-4">
        <MessageCircleWarning className="w-3.5 h-3.5" /> Community Reports
      </div>

      {loading ? <div className="text-gray-500 text-sm">Loading community reports...</div> : null}
      {!loading && reports.length === 0 ? <div className="text-gray-600 text-sm">No community submissions for this incident.</div> : null}

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3 space-y-2">
            <div className="text-white text-sm font-medium">{report.reporter_name}</div>
            <div className="text-gray-300 text-sm">{report.description}</div>
            <div className="text-gray-500 text-xs">{report.location_text}</div>

            {report.media_data_url ? (
              report.media_type?.startsWith('video/') ? (
                <video src={report.media_data_url} controls className="w-full rounded-lg border border-[#1f1f1f] max-h-64" />
              ) : (
                <img src={report.media_data_url} alt="community evidence" className="w-full rounded-lg border border-[#1f1f1f] max-h-64 object-cover" />
              )
            ) : (
              <div className="text-gray-600 text-xs flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> No media attached</div>
            )}

            {report.map_url ? (
              <a href={report.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-300 underline">
                <MapPin className="w-3.5 h-3.5" /> Open pinned map location
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
