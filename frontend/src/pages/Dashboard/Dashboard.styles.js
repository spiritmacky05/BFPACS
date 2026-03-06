export const styles = {
  loadingContainer: "flex items-center justify-center h-64",
  loadingFlex: "flex items-center gap-3",
  loadingIcon: "w-8 h-8 text-red-500 animate-pulse",
  loadingText: "text-gray-400 text-lg",
  
  pageContainer: "space-y-6",
  
  banner: {
    wrapper: "bg-gradient-to-r from-red-950/50 to-[#111] border border-red-900/30 rounded-xl p-6",
    flexRow: "flex items-center gap-4",
    iconBox: "w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center glow-red",
    icon: "w-8 h-8 text-white",
    title: "text-2xl font-bold text-white glow-text",
    subtitle: "text-gray-400 text-sm mt-1",
    liveIndicator: "ml-auto hidden md:flex items-center gap-2",
    liveIcon: "w-4 h-4 text-green-400 animate-pulse",
    liveText: "text-green-400 text-sm font-medium"
  },
  
  statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  mainGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  colSpan1: "lg:col-span-1",
  colSpan2: "lg:col-span-2",
  
  personnelLog: {
    wrapper: "bg-[#111] border border-[#1f1f1f] rounded-xl p-6",
    title: "text-white font-semibold mb-4 flex items-center gap-2",
    titleIcon: "w-4 h-4 text-red-400",
    emptyText: "text-gray-600 text-sm text-center py-6",
    tableWrapper: "overflow-x-auto",
    table: "w-full text-sm",
    theadTr: "border-b border-[#1f1f1f]",
    th: "text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4",
    tbody: "divide-y divide-[#1a1a1a]",
    tr: "hover:bg-white/2",
    tdName: "py-3 pr-4 text-white font-medium",
    tdText: "py-3 pr-4 text-gray-400",
    tdBadge: "py-3",
    badge: "text-xs px-2 py-0.5 rounded border text-green-400 border-green-600/30 bg-green-600/10"
  }
};
