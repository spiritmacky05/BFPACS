import { useState, useEffect } from "react";
import { X, AlertTriangle, Save } from "lucide-react";
import { personnelApi } from "@/api/personnel";
import { incidentsApi } from "@/api/incidents";

const ALARM_STATUS_OPTIONS = [
  "1st Alarm", "2nd Alarm", "3rd Alarm", "4th Alarm", "5th Alarm",
  "Task Force Alpha", "Task Force Bravo", "Task Force Charlie", "Task Force Delta",
  "General Alarm", "Fire Under Control", "Fire Out",
];

const INCIDENT_STATUS_OPTIONS = [
  "Active", "Controlled", "Fire Out", "Done"
];

const INPUT_CLS = "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none";
const LABEL_CLS = "block text-gray-400 text-xs uppercase tracking-wider mb-1";

export default function IncidentEditModal({ incident, onClose, onSaved }) {
  const [form, setForm] = useState({
    alarm_status: incident.alarm_status || "",
    incident_status: incident.incident_status || "",
    ground_commander: incident.ground_commander || "",
    ics_commander: incident.ics_commander || "",
    total_injured: incident.total_injured ?? "",
    total_rescued: incident.total_rescued ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [commanders, setCommanders] = useState([]);

  useEffect(() => {
    personnelApi.list().then(data => {
      // Just sort out the full_name of personnel so they can be selected as commanders
      if (data) {
        setCommanders(data.map(p => p.full_name).sort());
      }
    });
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form };
    
    if (payload.total_injured !== "") payload.total_injured = Number(payload.total_injured);
    else delete payload.total_injured;
    
    if (payload.total_rescued !== "") payload.total_rescued = Number(payload.total_rescued);
    else delete payload.total_rescued;

    try {
      await incidentsApi.updateStatus(incident.id, payload);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1f1f1f]">
          <div>
            <h2 className="text-white font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Edit Incident
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">{incident.location_text}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Operational Status */}
          <div className="text-xs text-red-400 uppercase tracking-widest font-semibold border-b border-[#1f1f1f] pb-2">Operational Status</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Overall Status</label>
              <select value={form.incident_status} onChange={e => set("incident_status", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {INCIDENT_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Alarm Level</label>
              <select value={form.alarm_status} onChange={e => set("alarm_status", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select —</option>
                {ALARM_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Command */}
          <div className="text-xs text-red-400 uppercase tracking-widest font-semibold border-b border-[#1f1f1f] pb-2">Command Staff</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Ground Commander</label>
              <select value={form.ground_commander} onChange={e => set("ground_commander", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select or type —</option>
                {commanders.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>ICS Commander</label>
              <select value={form.ics_commander} onChange={e => set("ics_commander", e.target.value)} className={INPUT_CLS}>
                <option value="">— Select or type —</option>
                {commanders.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Casualties */}
          <div className="text-xs text-red-400 uppercase tracking-widest font-semibold border-b border-[#1f1f1f] pb-2">Casualties</div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Total Injured</label>
              <input type="number" min="0" value={form.total_injured} onChange={e => set("total_injured", e.target.value)}
                placeholder="0" className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>Total Rescued</label>
              <input type="number" min="0" value={form.total_rescued} onChange={e => set("total_rescued", e.target.value)}
                placeholder="0" className={INPUT_CLS} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1f1f1f] flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}