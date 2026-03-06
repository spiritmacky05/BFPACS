import { useState, useMemo } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

const SELECT_CLS = "bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-600/50 w-full";

export default function StationFilter({ data, stationKey = "station", onChange }) {
  const [station, setStation]   = useState("");
  const [city, setCity]         = useState("");
  const [district, setDistrict] = useState("");
  const [region, setRegion]     = useState("");
  const [sortBy, setSortBy]     = useState("");
  const [sortDir, setSortDir]   = useState("asc");

  // Derive unique values from data
  const stations  = useMemo(() => [...new Set(data.map(d => d[stationKey]).filter(Boolean))].sort(), [data, stationKey]);
  const cities    = useMemo(() => [...new Set(data.map(d => d.city).filter(Boolean))].sort(), [data]);
  const districts = useMemo(() => [...new Set(data.map(d => d.district).filter(Boolean))].sort(), [data]);
  const regions   = useMemo(() => [...new Set(data.map(d => d.region).filter(Boolean))].sort(), [data]);

  const hasFilters = station || city || district || region;

  const apply = (overrides = {}) => {
    const s  = overrides.station  !== undefined ? overrides.station  : station;
    const c  = overrides.city     !== undefined ? overrides.city     : city;
    const di = overrides.district !== undefined ? overrides.district : district;
    const r  = overrides.region   !== undefined ? overrides.region   : region;
    const sb = overrides.sortBy   !== undefined ? overrides.sortBy   : sortBy;
    const sd = overrides.sortDir  !== undefined ? overrides.sortDir  : sortDir;

    let result = data.filter(d =>
      (!s  || d[stationKey] === s) &&
      (!c  || d.city    === c) &&
      (!di || d.district === di) &&
      (!r  || d.region  === r)
    );

    if (sb) {
      result = [...result].sort((a, b) => {
        const av = (a[sb] || "").toString().toLowerCase();
        const bv = (b[sb] || "").toString().toLowerCase();
        return sd === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    onChange(result);
  };

  const set = (key, val, setter) => {
    setter(val);
    apply({ [key]: val });
  };

  const clear = () => {
    setStation(""); setCity(""); setDistrict(""); setRegion("");
    setSortBy(""); setSortDir("asc");
    onChange(data);
  };

  const handleSort = (field) => {
    const newDir = sortBy === field && sortDir === "asc" ? "desc" : "asc";
    setSortBy(field);
    setSortDir(newDir);
    apply({ sortBy: field, sortDir: newDir });
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest">
          <Filter className="w-3.5 h-3.5 text-red-400" /> Filter & Sort
        </div>
        {hasFilters && (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-all">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Station */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Station</label>
          <div className="relative">
            <select value={station} onChange={e => set("station", e.target.value, setStation)} className={SELECT_CLS}>
              <option value="">All Stations</option>
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">City / Municipality</label>
          <select value={city} onChange={e => set("city", e.target.value, setCity)} className={SELECT_CLS}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">District</label>
          <select value={district} onChange={e => set("district", e.target.value, setDistrict)} className={SELECT_CLS}>
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Region</label>
          <select value={region} onChange={e => set("region", e.target.value, setRegion)} className={SELECT_CLS}>
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Sort pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="text-xs text-gray-600 self-center">Sort by:</span>
        {[
          { label: "Station", field: stationKey },
          { label: "City", field: "city" },
          { label: "District", field: "district" },
          { label: "Region", field: "region" },
        ].map(({ label, field }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs border transition-all ${
              sortBy === field
                ? "bg-red-600/20 border-red-600/50 text-red-400"
                : "bg-[#0d0d0d] border-[#2f2f2f] text-gray-500 hover:border-gray-500 hover:text-gray-300"
            }`}
          >
            {label}
            {sortBy === field && (
              <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}