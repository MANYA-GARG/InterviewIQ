import { CameraOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

const InterviewCameraFeed = ({
  stream,
  isCameraOn,
  className = '',
  muted = true,
  placeholder = 'Camera is off',
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play?.();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-900 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${isCameraOn ? 'opacity-100' : 'opacity-20'} transition-opacity duration-300`}
      />

      {!stream || !isCameraOn ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-200">
          <CameraOff className="h-8 w-8" />
          <p className="text-sm">{placeholder}</p>
        </div>
      ) : null}
    </div>
  );
};

export default InterviewCameraFeed;
