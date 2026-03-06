export default function StatCard({ label, value, icon: Icon, color = "red", sub }) {
  const colors = {
    red: "text-red-400 bg-red-600/10 border-red-600/20",
    green: "text-green-400 bg-green-600/10 border-green-600/20",
    yellow: "text-yellow-400 bg-yellow-600/10 border-yellow-600/20",
    blue: "text-blue-400 bg-blue-600/10 border-blue-600/20",
  };
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 hover:border-red-600/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}