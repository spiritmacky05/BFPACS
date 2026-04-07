// @ts-nocheck
import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Phone, AlertTriangle, MapPin, Upload } from 'lucide-react';
import { stationsApi } from '@/features/stations';
import { useQuery } from '@tanstack/react-query';
import { communityApi } from '../api/community.api';

const INCIDENT_ICON = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapPicker({ lat, lng, onPick }) {
  function ClickHandler() {
    useMapEvents({
      click(event) {
        onPick(event.latlng.lat, event.latlng.lng);
      },
    });
    return null;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#1f1f1f] h-56">
      <MapContainer center={lat && lng ? [lat, lng] : [14.5995, 120.9842]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <ClickHandler />
        {lat && lng ? <Marker position={[lat, lng]} icon={INCIDENT_ICON} /> : null}
      </MapContainer>
    </div>
  );
}

export default function CommunityPortalPage() {
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const { data: stations = [] } = useQuery({
    queryKey: ['community-stations'],
    queryFn: stationsApi.list,
  });

  const getStationContact = (station) => {
    const candidates = [
      station?.contact_number,
      station?.station_contact_number,
      station?.team_leader_contact,
      station?.contactNumber,
    ];

    const value = candidates.find((v) => typeof v === 'string' && v.trim() !== '');
    return value ? value.trim() : '';
  };

  const mapUrl = useMemo(() => {
    if (!lat || !lng) return '';
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }, [lat, lng]);

  const handlePick = (pickedLat, pickedLng) => {
    setLat(String(pickedLat.toFixed(6)));
    setLng(String(pickedLng.toFixed(6)));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setMediaDataUrl(String(reader.result || ''));
      setMediaType(file.type || 'application/octet-stream');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!description || !locationText) return;
    setSaving(true);
    setMessage('');

    try {
      await communityApi.submitReport({
        description,
        location_text: locationText,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        media_data_url: mediaDataUrl || undefined,
        media_type: mediaType || undefined,
        map_url: mapUrl || undefined,
      });

      setDescription('');
      setLocationText('');
      setLat('');
      setLng('');
      setMediaDataUrl('');
      setMediaType('');
      setMessage('Report sent. Fire station now sees this incident detail.');
    } catch {
      setMessage('Failed to submit report. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <h2 className="text-white font-semibold text-lg">Community Safety Portal</h2>
        <p className="text-gray-400 text-sm mt-1">View fire stations, auto-call, and send incident reports with media and map pin.</p>
      </div>

      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-orange-400 uppercase tracking-widest font-semibold mb-4">
          <Phone className="w-3.5 h-3.5" /> Fire Stations Auto-Call
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stations.map((station) => (
            (() => {
              const stationContact = getStationContact(station);
              return (
            <div key={station.id} className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
              <div className="text-white text-sm font-semibold">{station.station_name}</div>
              <div className="text-gray-500 text-xs mt-1">{station.city} • {station.district}</div>
              {stationContact ? (
                <a href={`tel:${stationContact}`} className="inline-flex items-center gap-2 mt-3 text-xs px-2.5 py-1.5 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-500/10">
                  <Phone className="w-3.5 h-3.5" /> Auto-Call Station
                </a>
              ) : (
                <div className="text-gray-600 text-xs mt-3">No contact number yet</div>
              )}
              {stationContact ? (
                <div className="text-gray-400 text-xs mt-2">{stationContact}</div>
              ) : null}
            </div>
              );
            })()
          ))}
        </div>
      </div>

      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-red-400 uppercase tracking-widest font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" /> Report Incident
        </div>

        <input
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Incident address"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe current situation"
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm min-h-24"
        />

        <div>
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Tap map to pin exact location
          </div>
          <MapPicker lat={lat ? parseFloat(lat) : null} lng={lng ? parseFloat(lng) : null} onPick={handlePick} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm" />
            <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded border border-[#2a2a2a] text-gray-300 cursor-pointer hover:border-red-500/40">
          <Upload className="w-3.5 h-3.5" /> Add Picture or Video
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        </label>

        {mediaDataUrl ? (
          mediaType.startsWith('video/') ? (
            <video src={mediaDataUrl} controls className="w-full max-h-60 rounded-lg border border-[#1f1f1f]" />
          ) : (
            <img src={mediaDataUrl} alt="incident evidence" className="w-full max-h-60 object-cover rounded-lg border border-[#1f1f1f]" />
          )
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={saving || !description || !locationText}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60"
        >
          {saving ? 'Submitting...' : 'Submit Community Report'}
        </button>

        {message ? <div className="text-xs text-gray-300">{message}</div> : null}
      </div>
    </section>
  );
}
