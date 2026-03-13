import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { TrendingUp, Flame, Truck, Users } from "lucide-react";

const PIE_COLORS = ["#dc2626", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

/**
 * @param {any} props
 */
const CustomTooltip = (props) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d0d] border border-red-900/40 rounded-lg px-3 py-2 text-xs shadow-2xl shadow-black/60">
      {label && <div className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-3.5 h-3.5 text-red-500" />
    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.15em]">{title}</span>
    <div className="flex-1 h-px bg-gradient-to-r from-red-900/30 to-transparent" />
  </div>
);

const EmptyState = ({ label }) => (
  <div className="flex items-center justify-center h-[160px]">
    <span className="text-gray-700 text-xs">{label}</span>
  </div>
);

export default function AnalyticsCharts({ incidents, trucks, personnel }) {
  const incidentsByType = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { 
      const type = i.response_type || i.occupancy_type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1; 
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const incidentsByStatus = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { 
      const status = i.incident_status || 'Unknown';
      counts[status] = (counts[status] || 0) + 1; 
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const truckStatusData = useMemo(() => {
    const counts = {};
    trucks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trucks]);

  const personnelByRank = useMemo(() => {
    const counts = {};
    personnel.forEach(p => { counts[p.rank] = (counts[p.rank] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [personnel]);

  const truckColor = (name) =>
    name === "Available" || name === "Serviceable" ? "#10b981" :
    name === "Deployed" || name === "Dispatched" ? "#dc2626" :
    name === "Under Maintenance" ? "#f59e0b" : "#374151";

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Analytics Overview</h3>
          <p className="text-gray-600 text-xs">Operational data breakdown</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-red-950/30 border border-red-900/30 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-[10px] font-medium uppercase tracking-widest">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Incidents by Type */}
        <div className="bg-[#111] border border-[#1f1f1f] hover:border-red-900/30 transition-colors rounded-xl p-4">
          <SectionHeader icon={Flame} title="Incidents by Type" />
          {incidentsByType.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={incidentsByType} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={props => <CustomTooltip {...props} />} cursor={{ fill: "rgba(220,38,38,0.05)" }} />
                <Bar dataKey="value" name="Count" fill="url(#redGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No incident data" />}
        </div>

        {/* Incident Status Pie */}
        <div className="bg-[#111] border border-[#1f1f1f] hover:border-red-900/30 transition-colors rounded-xl p-4">
          <SectionHeader icon={Flame} title="Incident Status Breakdown" />
          {incidentsByStatus.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie
                    data={incidentsByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    strokeWidth={0}
                  >
                    {incidentsByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={props => <CustomTooltip {...props} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {incidentsByStatus.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-500 text-[10px] truncate">{entry.name}</span>
                    </div>
                    <span className="text-white text-xs font-bold">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState label="No status data" />}
        </div>

        {/* Fleet by Status */}
        <div className="bg-[#111] border border-[#1f1f1f] hover:border-red-900/30 transition-colors rounded-xl p-4">
          <SectionHeader icon={Truck} title="Fleet by Status" />
          {truckStatusData.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={truckStatusData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={props => <CustomTooltip {...props} />} cursor={{ fill: "rgba(220,38,38,0.05)" }} />
                <Bar dataKey="value" name="Units" radius={[4, 4, 0, 0]}>
                  {truckStatusData.map((entry, i) => (
                    <Cell key={i} fill={truckColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No fleet data" />}
        </div>

        {/* Personnel by Rank */}
        <div className="bg-[#111] border border-[#1f1f1f] hover:border-red-900/30 transition-colors rounded-xl p-4">
          <SectionHeader icon={Users} title="Personnel by Rank" />
          {personnelByRank.length ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={personnelByRank} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 24 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis type="number" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={props => <CustomTooltip {...props} />} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Bar dataKey="value" name="Personnel" fill="url(#blueGrad)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState label="No personnel data" />}
        </div>

      </div>
    </div>
  );
}
