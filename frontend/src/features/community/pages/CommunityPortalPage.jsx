// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Flame, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  X, 
  Camera,
  MapPin,
  Zap,
  Navigation
} from 'lucide-react';
import { communityApi } from '../api/community.api';

// Images generated for the buttons
const FIRE_IMG = '/fire_icon.png';
const PNP_IMG = '/police_icon.png';
const DISASTER_IMG = '/disaster_icon.png';

// BFPACS Theme Colors
const COLORS = {
  primary: '#C02626', // Red-600
  secondary: '#EAB308', // Yellow-500
  dark: '#0a0a0a',
  card: '#111111',
  border: '#1f1f1f'
};

/**
 * Pure React Modal Component - Mobile Priority
 */
function ReportModal({ isOpen, onClose, category, onSubmit, loading, coords, setCoords }) {
    const [manualAddress, setManualAddress] = useState("");
  const [geoError, setGeoError] = useState("");
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const fileInputRef = useRef(null);

  // Fetch location every time modal opens
  useEffect(() => {
    if (isOpen && (coords.lat === null || coords.lng === null)) {
      setGeoError("");
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setGeoError("");
          },
          (err) => {
            let msg = "Could not get your location.";
            if (err.code === 1) msg = "Location access denied. Please enable location services.";
            else if (err.code === 2) msg = "Location unavailable. Try again or check settings.";
            else if (err.code === 3) msg = "Location request timed out. Try again.";
            setGeoError(msg);
          }
        );
      } else {
        setGeoError("Geolocation is not supported by your browser.");
      }
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const handleUseMyLocation = () => {
    setGeoError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoError("");
        },
        (err) => {
          let msg = "Could not get your location.";
          if (err.code === 1) msg = "Location access denied.";
          else if (err.code === 2) msg = "Location unavailable.";
          else if (err.code === 3) msg = "Location request timed out.";
          setGeoError(msg);
        }
      );
    } else {
      setGeoError("Geolocation is not supported by your browser.");
    }
  };

  // Custom marker icon for Leaflet
  const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
    return coords.lat && coords.lng ? (
      <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
    ) : null;
  }

  useEffect(() => {
    if (coords.lat && coords.lng) {
      setLocationText(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    }
  }, [coords]);

  if (!isOpen) return null;

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

  const handleFormSubmit = () => {
    onSubmit({
      description,
      location_text: manualAddress || locationText,
      manual_address: manualAddress,
      media_data_url: mediaDataUrl || undefined,
      media_type: mediaType || undefined,
      category
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center bg-black/90 md:bg-black/80 md:backdrop-blur-sm animate-in fade-in duration-200 md:p-4">
      <div className="mobile-modal bg-[#111] w-full flex flex-col shadow-2xl overflow-hidden border-t md:border border-[#2a2a2a] md:rounded-[2rem] rounded-t-[1.5rem] animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Mobile Pull Indicator (Visual only) */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1 bg-[#1a1a1a]">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        {/* Header - Fixed */}
        <div className="flex-none flex items-center justify-between px-5 pb-4 pt-2 md:pt-6 border-b border-[#1f1f1f] bg-[#1a1a1a] safe-top">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${
              category === 'FIRE' ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
              category === 'PNP' ? 'bg-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 
              'bg-orange-500/20 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
            }`}>
              {category === 'FIRE' && <Flame className="w-6 h-6" />}
              {category === 'PNP' && <ShieldCheck className="w-6 h-6" />}
              {category === 'DRRMO' && <Activity className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-white font-black text-lg md:text-xl leading-tight tracking-wide">REPORT {category}</h3>
              <p className="text-gray-400 text-[11px] font-medium uppercase tracking-widest mt-0.5">Emergency Dispatch</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white/10 rounded-full text-gray-400 transition-colors bg-white/5" 
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 custom-scrollbar bg-[#0a0a0a]">
          
          {/* Location Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Incident Location</label>
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Pinpointing location..."
                className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-4 text-[15px] focus:border-red-500/50 outline-none transition-colors shadow-inner"
                readOnly
              />
            </div>
            {geoError && (
              <div className="mt-3">
                <label className="text-xs font-bold text-red-400 uppercase mb-1.5 block">Enter Address or Landmark (Required)</label>
                <input
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="e.g. 123 Main St, Barangay, City"
                  className="w-full bg-[#111] border border-red-500 text-white rounded-xl px-4 py-4 text-[15px] focus:border-red-500 outline-none transition-colors"
                  required
                />
                <div className="text-xs text-red-400 mt-1">Location not available. Please enter your address or landmark above.</div>
              </div>
            )}

            {/* Map Container */}
            <div className="w-full h-52 md:h-64 rounded-xl overflow-hidden border border-[#2a2a2a] relative z-0 shadow-lg">
              {coords.lat && coords.lng ? (
                <MapContainer
                  center={[coords.lat, coords.lng]}
                  zoom={17}
                  style={{ width: '100%', height: '100%' }}
                  scrollWheelZoom={true}
                  dragging={true}
                  touchZoom={true}
                  doubleClickZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker />
                </MapContainer>
              ) : geoError ? (
                <div className="flex flex-col items-center justify-center h-full text-red-400 text-sm font-medium text-center px-6 bg-[#111]">
                  <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                  {geoError}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm font-medium bg-[#111] animate-pulse">
                  <Navigation className="w-6 h-6 mb-2 opacity-50" />
                  Acquiring GPS Signal...
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <p className="text-[13px] text-gray-400 flex-1 px-1">
                Tap the map to adjust the pin exactly where the incident is.
              </p>
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#1f1f1f] border border-[#333] hover:bg-[#2a2a2a] text-white font-semibold transition-colors text-sm"
              >
                <Navigation className="w-4 h-4 text-yellow-500" />
                Recenter GPS
              </button>
            </div>
          </div>

          <hr className="border-[#1f1f1f]" />

          {/* Details Section */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Situation Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is happening? Describe the emergency, injuries, or hazards..."
              className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-xl px-5 py-4 text-[15px] min-h-[130px] focus:border-red-500/50 outline-none transition-colors resize-none shadow-inner"
            />
          </div>

          {/* Media Section */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Visual Evidence <span className="text-gray-600 font-normal ml-1">(Optional)</span></label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all ${
                mediaDataUrl ? 'border-transparent bg-[#111]' : 'border-[#2a2a2a] bg-[#111]/50 hover:border-red-500/40'
              }`}
            >
              {mediaDataUrl ? (
                <div className="relative w-full">
                  {mediaType.startsWith('video/') ? (
                    <video src={mediaDataUrl} controls className="w-full max-h-48 rounded-lg object-contain bg-black" />
                  ) : (
                    <img src={mediaDataUrl} alt="preview" className="w-full max-h-48 rounded-lg object-contain bg-black" />
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMediaDataUrl(''); }}
                    className="absolute -top-3 -right-3 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-[#1a1a1a] rounded-full text-gray-400 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-gray-200">Tap to Upload Photo/Video</p>
                    <p className="text-xs text-gray-500 mt-1">Helps responders assess the situation</p>
                  </div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*,video/*" 
                className="hidden" 
                onChange={handleFile} 
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-none p-5 border-t border-[#1f1f1f] bg-[#1a1a1a] flex gap-3 z-50 safe-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.4)] relative">
          <button
            onClick={onClose}
            className="flex-1 px-2 py-4 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white text-[15px] font-bold tracking-wider transition-colors min-h-[56px] max-w-[120px]"
          >
            CANCEL
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={loading || !description || (!locationText && !manualAddress)}
            className="flex-2 w-full px-4 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[15px] font-bold tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] min-h-[56px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SENDING...
              </span>
            ) : (
              'SUBMIT EMERGENCY'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPortalPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Location access denied", err)
      );
    }
  }, []);

  const handleOpenReport = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleSubmitReport = async (data) => {
    setSubmitting(true);
    setMessage('');

    let address = '';
    if (data.manual_address) {
      address = data.manual_address;
    } else {
      try {
        if (coords.lat && coords.lng) {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`);
          if (resp.ok) {
            const json = await resp.json();
            address = json.display_name || '';
          }
        }
      } catch (e) {
        address = `${coords.lat}, ${coords.lng}`;
      }
    }

    try {
      await communityApi.submitReport({
        ...data,
        description: `[${data.category}] ${data.description}`,
        lat: coords.lat,
        lng: coords.lng,
        address: address || `${coords.lat}, ${coords.lng}`
      });

      setMessage('REPORT SUBMITTED SUCCESSFULLY. EMERGENCY SERVICES NOTIFIED.');
      setModalOpen(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0a0a] overflow-x-hidden pt-8 pb-20 px-5">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-yellow-600/5 blur-[80px] pointer-events-none" />

      {/* Top Logos */}
      <div className="flex justify-center items-center gap-6 mb-12 relative z-10">
        <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Seal_of_Las_Pi%C3%B1as.png" alt="City Seal" className="w-14 h-14 object-contain drop-shadow-lg" />
        <div className="flex flex-col items-center">
            <div className="text-white font-black text-[10px] tracking-[0.25em] opacity-80">LAS PIÑAS</div>
            <div className="flex gap-1 my-1">
                {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)]" />)}
            </div>
            <div className="text-white font-bold text-[9px] tracking-widest opacity-50">OUR HOME</div>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Bureau_of_Fire_Protection.png" alt="BFP Seal" className="w-14 h-14 object-contain drop-shadow-lg" />
      </div>

      {/* Branding Section */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center gap-2 mb-6 w-full">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter flex items-center justify-center gap-1">
            LIGT<Zap className="w-10 h-10 md:w-14 md:h-14 text-yellow-500 fill-yellow-500" strokeWidth={3} />S KA
          </h1>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-[2rem] animate-pulse">
            <AlertTriangle className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
          </div>
        </div>

        <p className="max-w-[280px] mx-auto text-gray-400 text-[15px] leading-relaxed">
          Maligayang pagbubukas.<br />
          Isang <span className="text-red-500 font-bold">ligtas na araw</span>, Las Piñas!
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-16 relative z-10">
        <button 
          onClick={() => handleOpenReport('FIRE')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-red-600/50 rounded-[2rem] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/20 active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-[1.5rem] p-5 mb-5 mx-auto w-fit shadow-inner">
            <img src={FIRE_IMG} alt="Fire" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-300 font-black text-lg tracking-widest uppercase group-hover:text-red-500 transition-colors">FIRE</h3>
        </button>

        <button 
          onClick={() => handleOpenReport('PNP')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-blue-600/50 rounded-[2rem] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-[1.5rem] p-5 mb-5 mx-auto w-fit shadow-inner">
            <img src={PNP_IMG} alt="PNP" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-300 font-black text-lg tracking-widest uppercase group-hover:text-blue-500 transition-colors">PNP</h3>
        </button>

        <button 
          onClick={() => handleOpenReport('DRRMO')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-orange-600/50 rounded-[2rem] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/20 active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-[1.5rem] p-5 mb-5 mx-auto w-fit shadow-inner">
            <img src={DISASTER_IMG} alt="DRRMO" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-300 font-black text-lg tracking-widest uppercase group-hover:text-orange-500 transition-colors">DRRMO</h3>
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className="fixed bottom-10 left-0 right-0 px-5 z-40 flex justify-center pointer-events-none animate-in slide-in-from-bottom-5">
           <div className="bg-red-600 text-white px-6 py-4 rounded-2xl font-bold text-xs tracking-widest shadow-2xl shadow-red-900/50 flex items-center gap-3 w-full max-w-md text-center justify-center pointer-events-auto">
             <ShieldCheck className="w-5 h-5 flex-shrink-0" />
             {message}
           </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center relative z-10 pb-6 opacity-40">
        <div className="text-[10px] font-bold text-red-500 tracking-[.3em] uppercase mb-2">
          LIGTAS KA • RESPONDER APP
        </div>
        <div className="text-[9px] text-gray-500 font-medium tracking-wide">
          Version 2.4.0 All Rights Reserved. @2026<br />
          Powered by BFPACS Mobile Dev Team
        </div>
      </div>

      <ReportModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        category={selectedCategory} 
        onSubmit={handleSubmitReport}
        loading={submitting}
        coords={coords}
        setCoords={setCoords}
      />

      <style>{`
        /* Dynamic viewport height for mobile browsers */
        .mobile-modal {
          height: 100dvh; 
        }
        
        @media (min-width: 768px) {
          .mobile-modal {
            height: auto;
            max-height: 85vh;
          }
        }

        /* Safe area handling for iOS notches/home bars */
        .safe-top {
          padding-top: max(env(safe-area-inset-top), 1rem);
        }
        .safe-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 1.25rem);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation-duration: 0.35s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in-95; }
      `}</style>
    </div>
  );
}