import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, MapPin, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export default function PunchModal({ type, onClose, onConfirm, isLoading }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);

  const [camReady,   setCamReady]   = useState(false);
  const [camError,   setCamError]   = useState('');
  const [location,   setLocation]   = useState(null);
  const [gpsError,   setGpsError]   = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [captured,   setCaptured]   = useState(null); 
    //  location change
  const OFFICE_LAT = 23.258181; 
  const OFFICE_LNG = 77.411266; 
  const ALLOWED_RADIUS = 100; 


  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current         = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCamReady(true);
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permission.');
    }
  }, []);

 
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    startCamera();
    fetchLocation();
    return () => stopCamera();
  }, [startCamera, stopCamera]);


  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          address:   '',
        });
        setGpsLoading(false);
        setGpsError('');
      },
      (err) => {
        setGpsError('Location access denied. Please allow location.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };


  const captureSelfie = () => {
    if (!camReady || !videoRef.current) return;
    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext('2d');
    canvas.width  = videoRef.current.videoWidth  || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
    setCaptured(base64);
    stopCamera(); 
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };


const handleSubmit = async () => {
    if (!captured) { toast.error('Please capture your selfie first'); return; }
    if (!location) { toast.error('Location not fetched yet'); return; }
    const distance = getDistanceInMeters(location.latitude, location.longitude, OFFICE_LAT, OFFICE_LNG); 
  //  commit out if you want close hard coded location 
//     if (distance > ALLOWED_RADIUS) {
//      toast.error(`You are far from office! ${Math.round(distance)}m door ho.`);
//   onClose(); 
//   return;                  
// }
await onConfirm(captured, location); 

    await onConfirm(captured, location);
  };

  const isIn = type === 'in';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-surface-border
                      rounded-2xl shadow-2xl animate-slide-up overflow-hidden">

  
        <div className={`flex items-center justify-between px-6 py-4 border-b border-surface-border
                         ${isIn ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                             ${isIn ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white">
                Punch {isIn ? 'In' : 'Out'}
              </h3>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg
                       hover:bg-surface">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">


          <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">

      
            {!captured && (
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            )}

       
            {captured && (
              <img src={captured} alt="Selfie preview"
                className="w-full h-full object-cover" />
            )}

       
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center
                              bg-surface gap-3 text-center px-6">
                <AlertCircle size={32} className="text-rose-400" />
                <p className="text-sm text-slate-300">{camError}</p>
              </div>
            )}

           
            {!captured && camReady && (
              <>
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br" />
              </>
            )}

        
            {captured && (
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500
                              flex items-center justify-center shadow-lg">
                <CheckCircle size={18} className="text-white" />
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

     
          <div className="flex gap-3">
            {!captured ? (
              <button
                onClick={captureSelfie}
                disabled={!camReady}
                className={`flex-1 btn-primary ${!camReady ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Camera size={16} />
                {camReady ? 'Capture Selfie' : 'Starting camera...'}
              </button>
            ) : (
              <button onClick={retake} className="flex-1 btn-ghost">
                <Camera size={16} /> Retake
              </button>
            )}
          </div>

     
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                           ${location
                               ? 'bg-emerald-500/5 border-emerald-500/20'
                               : gpsError
                               ? 'bg-rose-500/5 border-rose-500/20'
                               : 'bg-surface border-surface-border'}`}>
            <MapPin size={16} className={
              location   ? 'text-emerald-400' :
              gpsError   ? 'text-rose-400'    : 'text-slate-400'
            } />
            <div className="flex-1 min-w-0">
              {gpsLoading && (
                <p className="text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Fetching location...
                </p>
              )}
              {location && !gpsLoading && (
                <p className="text-sm text-emerald-400 font-medium">
                  Location captured ✓
                  <span className="text-slate-500 text-xs ml-2 font-normal">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                </p>
              )}
              {gpsError && !gpsLoading && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-rose-400">{gpsError}</p>
                  <button onClick={fetchLocation}
                    className="text-xs text-brand-400 hover:text-brand-300 ml-2 shrink-0">
                    Retry
                  </button>
                </div>
              )}
              {!location && !gpsLoading && !gpsError && (
                <p className="text-sm text-slate-400">Waiting for location...</p>
              )}
            </div>
          </div>

      
          <button
            onClick={handleSubmit}
            disabled={!captured || !location || isLoading}
            className={`w-full btn-primary text-base py-3
                        ${isIn
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={18} />
                Confirm Punch {isIn ? 'In' : 'Out'}
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
