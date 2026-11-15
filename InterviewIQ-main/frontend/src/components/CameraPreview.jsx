import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

const CameraPreview = ({ active = true, onStatusChange, onStreamChange }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        onStreamChange?.(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (!active) {
      stopStream();
      setCameraOn(false);
      setError('');
      setIsInitializing(false);
      onStatusChange?.({ on: false, error: '' });
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        const unsupportedMessage =
          'Camera and microphone are not supported in this browser. Please use a modern browser over HTTPS/localhost.';
        setError(unsupportedMessage);
        setCameraOn(false);
        setIsInitializing(false);
        onStatusChange?.({ on: false, error: unsupportedMessage });
        return;
      }

      setIsInitializing(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        onStreamChange?.(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play?.();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
              // Browser may block autoplay until user interaction.
            });
          }
        }
        setError('');
        setCameraOn(true);
        setIsInitializing(false);
        onStatusChange?.({ on: true, error: '' });
      } catch (cameraError) {
        if (!isMounted) return;

        const message =
          cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError'
            ? 'Permission denied. Please allow camera and microphone access.'
            : cameraError?.name === 'NotFoundError' || cameraError?.name === 'DevicesNotFoundError'
            ? 'Camera or microphone not found. Please connect devices and try again.'
            : cameraError?.name === 'NotReadableError' || cameraError?.name === 'TrackStartError'
            ? 'Camera or microphone is currently in use by another app.'
            : cameraError?.name === 'OverconstrainedError'
            ? 'Requested media settings are not supported by your device.'
            : 'Unable to access camera. Please check your device settings.';
        setError(message);
        setCameraOn(false);
        setIsInitializing(false);
        onStatusChange?.({ on: false, error: message });
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
      setCameraOn(false);
      setIsInitializing(false);
      onStatusChange?.({ on: false, error: '' });
    };
  }, [active, onStatusChange, onStreamChange, retryToken]);

  const handleRetry = () => {
    setRetryToken((prev) => prev + 1);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-sm">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover scale-x-[-1] transition-opacity duration-300 ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300 px-4 text-center">
            <CameraOff className="h-8 w-8" />
            <p className="text-sm">
              {error || (isInitializing ? 'Starting camera and microphone...' : 'Camera preview is off')}
            </p>
            <p className="text-xs text-slate-400">Use localhost/HTTPS and allow browser camera permission.</p>
            {error && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-white"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {cameraOn && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-1 text-xs font-semibold text-white">
            <Camera className="h-3.5 w-3.5" />
            Camera + Mic ON
          </span>
        )}
      </div>
    </div>
  );
};

export default CameraPreview;
