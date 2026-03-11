/**
 * components/common/MapView.jsx
 *
 * Reusable Leaflet map component for BFP ACS.
 * - Dark tile layer matching the app theme
 * - Colored markers for incidents (red), hydrants (blue/yellow/gray), user location (green)
 * - Popup with info + "Get Directions" link (opens Google Maps / Waze)
 * - Fits bounds to show all markers
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Custom colored markers ──────────────────────────────────────────────────
function svgIcon(color, size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#000" stroke-width="0.5"/>
    <circle cx="12" cy="9" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const ICONS = {
  incident:    svgIcon('#ef4444', 32),  // red
  hydrantOk:   svgIcon('#3b82f6', 26),  // blue  — Serviceable
  hydrantWarn: svgIcon('#eab308', 26),  // yellow — Under Maintenance
  hydrantBad:  svgIcon('#6b7280', 26),  // gray  — Out of Service
  user:        svgIcon('#22c55e', 30),  // green  — Your location
  station:     svgIcon('#f97316', 30),  // orange — Fire station
};

function hydrantIcon(status) {
  if (status === 'Serviceable' || status === 'Operational') return ICONS.hydrantOk;
  if (status === 'Under Maintenance') return ICONS.hydrantWarn;
  return ICONS.hydrantBad;
}

// ── Helper: auto-fit bounds ─────────────────────────────────────────────────
function FitBounds({ markers }) {
  const map = useMap();
  const prevCount = useRef(0);
  useEffect(() => {
    const pts = markers.filter(m => m.lat != null && m.lng != null);
    if (!pts.length || pts.length === prevCount.current) return;
    const bounds = L.latLngBounds(pts.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds.pad(0.15), { maxZoom: 16 });
    prevCount.current = pts.length;
  }, [markers, map]);
  return null;
}

// ── Directions links ────────────────────────────────────────────────────────
function DirectionsLinks({ lat, lng, label }) {
  const gUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const wUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  return (
    <div className="flex gap-2 mt-1">
      <a href={gUrl} target="_blank" rel="noopener noreferrer"
         className="text-[11px] text-blue-400 underline">Google Maps</a>
      <a href={wUrl} target="_blank" rel="noopener noreferrer"
         className="text-[11px] text-purple-400 underline">Waze</a>
    </div>
  );
}

/**
 * @param {{ markers: Array<{lat,lng,type,label,sub,status}>, height?: string, center?: [number,number], zoom?: number }} props
 *
 * marker.type = 'incident' | 'hydrant' | 'user'
 */
export default function MapView({ markers = [], height = '400px', center, zoom = 13 }) {
  const validMarkers = markers.filter(m => m.lat != null && m.lng != null);
  const defaultCenter = validMarkers.length
    ? [validMarkers[0].lat, validMarkers[0].lng]
    : center ?? [14.5995, 120.9842]; // Manila fallback

  return (
    <div className="rounded-xl overflow-hidden border border-[#1f1f1f]" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
      >
        {/* Dark tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <FitBounds markers={validMarkers} />

        {validMarkers.map((m, i) => {
          const icon =
            m.type === 'incident' ? ICONS.incident
            : m.type === 'station' ? ICONS.station
            : m.type === 'user' ? ICONS.user
            : hydrantIcon(m.status);
          return (
            <Marker key={`${m.type}-${i}`} position={[m.lat, m.lng]} icon={icon}>
              <Popup>
                <div className="text-xs space-y-0.5" style={{ minWidth: 140 }}>
                  <div className="font-semibold text-sm" style={{ color: '#111' }}>{m.label || 'Location'}</div>
                  {m.sub && <div style={{ color: '#555' }}>{m.sub}</div>}
                  {m.distance != null && <div style={{ color: '#3b82f6' }}>{Math.round(m.distance)}m away</div>}
                  <DirectionsLinks lat={m.lat} lng={m.lng} label={m.label} />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
