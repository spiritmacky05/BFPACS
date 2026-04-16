// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  X, 
  Upload, 
  Camera,
  MapPin,
  Zap
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
 * Pure React Modal Component
 */
function ReportModal({ isOpen, onClose, category, onSubmit, loading }) {
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [mediaDataUrl, setMediaDataUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const fileInputRef = useRef(null);

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
      location_text: locationText,
      media_data_url: mediaDataUrl || undefined,
      media_type: mediaType || undefined,
      category
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-[#2a2a2a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f] bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              category === 'FIRE' ? 'bg-red-500/20 text-red-500' : 
              category === 'PNP' ? 'bg-blue-500/20 text-blue-500' : 
              'bg-orange-500/20 text-orange-500'
            }`}>
              {category === 'FIRE' && <Flame className="w-5 h-5" />}
              {category === 'PNP' && <ShieldCheck className="w-5 h-5" />}
              {category === 'DRRMO' && <Activity className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-white font-bold leading-tight">REPORT {category}</h3>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider">Emergency Response Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-1.5 block">Incident Address / Landmark</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Where is this happening?"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:border-red-500/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about the situation..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl px-4 py-3 text-sm min-h-[100px] focus:border-red-500/50 outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase mb-1.5 block">Evidence (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-[#2a2a2a] hover:border-red-500/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all bg-[#0a0a0a]/50"
            >
              {mediaDataUrl ? (
                mediaType.startsWith('video/') ? (
                  <video src={mediaDataUrl} controls className="w-full max-h-40 rounded-lg object-contain" />
                ) : (
                  <img src={mediaDataUrl} alt="preview" className="w-full max-h-40 rounded-lg object-contain" />
                )
              ) : (
                <>
                  <div className="p-3 bg-red-500/10 rounded-full text-red-500 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-300">Take Photo or Upload</p>
                    <p className="text-[10px] text-gray-600 mt-1">Images or Videos of the incident</p>
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
            {mediaDataUrl && (
              <button 
                onClick={(e) => { e.stopPropagation(); setMediaDataUrl(''); }}
                className="mt-2 text-[10px] text-red-400 hover:underline uppercase font-bold tracking-widest"
              >
                Remove Media
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f1f1f] bg-[#1a1a1a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleFormSubmit}
            disabled={loading || !description || !locationText}
            className="flex-2 px-8 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-900/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? 'SUBMITTING...' : 'SUBMIT REPORT'}
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

  // Automatically fetch location on mount
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

    try {
      await communityApi.submitReport({
        ...data,
        description: `[${data.category}] ${data.description}`,
        lat: coords.lat,
        lng: coords.lng,
      });

      setMessage('REPORT SUBMITTED SUCCESSFULLY. EMERGENCY SERVICES NOTIFIED.');
      setModalOpen(false);
      // Reset after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit report. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-x-hidden pt-6 pb-20 px-4">
      {/* Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-red-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-yellow-600/5 blur-[80px] pointer-events-none" />

      {/* Top Logos */}
      <div className="flex justify-center items-center gap-6 mb-12 relative z-10">
        <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Seal_of_Las_Pi%C3%B1as.png" alt="City Seal" className="w-16 h-16 object-contain drop-shadow-lg" />
        <div className="flex flex-col items-center">
            <div className="text-white font-black text-xs tracking-[0.2em] opacity-80">LAS PIÑAS</div>
            <div className="flex gap-1">
                {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />)}
            </div>
            <div className="text-white font-medium text-[9px] mt-1 opacity-60">OUR HOME</div>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Bureau_of_Fire_Protection.png" alt="BFP Seal" className="w-16 h-16 object-contain drop-shadow-lg" />
      </div>

      {/* Branding Section */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-4 mb-4">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter flex items-center gap-2">
            LIGT<Zap className="w-10 h-10 md:w-16 md:h-16 text-yellow-500 fill-yellow-500" strokeWidth={3} />S KA
          </h1>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-3xl animate-pulse">
            <AlertTriangle className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
          </div>
        </div>

        <p className="max-w-xs mx-auto text-gray-400 text-sm leading-relaxed italic">
          Hi, maligayang pagbubukas sa ating mobile app.<br />
          Isang <span className="text-red-500 font-bold">ligtas na araw</span>, Las Piñas City!
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16 relative z-10">
        {/* FIRE Button */}
        <button 
          onClick={() => handleOpenReport('FIRE')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-red-600/50 rounded-[32px] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/10 active:scale-95 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mb-4 mx-auto w-fit shadow-inner">
            <img src={FIRE_IMG} alt="Fire" className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-400 font-bold text-lg tracking-widest uppercase group-hover:text-red-500 transition-colors">FIRE</h3>
        </button>

        {/* PNP Button */}
        <button 
          onClick={() => handleOpenReport('PNP')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-blue-600/50 rounded-[32px] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 active:scale-95 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mb-4 mx-auto w-fit shadow-inner">
            <img src={PNP_IMG} alt="PNP" className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-400 font-bold text-lg tracking-widest uppercase group-hover:text-blue-500 transition-colors">PNP</h3>
        </button>

        {/* DRRMO Button */}
        <button 
          onClick={() => handleOpenReport('DRRMO')}
          className="group relative bg-[#111] border border-[#1f1f1f] hover:border-orange-600/50 rounded-[32px] p-6 text-center transition-all duration-300 hover:shadow-2xl hover:shadow-orange-900/10 active:scale-95 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-600/10 transition-colors" />
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mb-4 mx-auto w-fit shadow-inner">
            <img src={DISASTER_IMG} alt="DRRMO" className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h3 className="text-gray-400 font-bold text-lg tracking-widest uppercase group-hover:text-orange-500 transition-colors">DRRMO</h3>
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5">
           <div className="bg-red-600 text-white px-6 py-3 rounded-full font-bold text-xs tracking-widest shadow-xl shadow-red-900/40 flex items-center gap-3">
             <ShieldCheck className="w-4 h-4" />
             {message}
           </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center relative z-10 pb-6 opacity-40">
        <div className="text-[10px] font-bold text-red-500 tracking-[.3em] uppercase mb-2">
          LIGTAS KA • BFPACS RESPONDER APP
        </div>
        <div className="text-[9px] text-gray-600">
          Version 2.4.0 All Rights Reserved. @2026<br />
          Powered by BFPACS Mobile Dev Team
        </div>
      </div>

      {/* Modal Integration */}
      <ReportModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        category={selectedCategory} 
        onSubmit={handleSubmitReport}
        loading={submitting}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f1f1f;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #C02626;
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
          animation-duration: 0.3s;
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fade-in; }
        .zoom-in-95 { animation-name: zoom-in-95; }
      `}</style>
    </div>
  );
}
