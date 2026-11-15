import { Camera, CameraOff, Mic, MicOff, Play, ShieldCheck } from 'lucide-react';
import InterviewCameraFeed from './InterviewCameraFeed';

const InterviewJoinScreen = ({
  stream,
  isCameraOn,
  isMicOn,
  permissionError,
  cameraLoading,
  onToggleCamera,
  onToggleMic,
  onStart,
  starting,
  phase,
  roleLabel,
}) => {
  const isSetup = phase === 'SETUP';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1e293b,#020617)] text-white px-6 py-8">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-6xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-sky-300 text-sm uppercase tracking-[0.25em]">InterviewIQ</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Interview Room Setup</h1>
          <p className="mt-3 text-slate-300">Check camera and microphone before starting your {roleLabel} interview.</p>
          <p className="mt-2 text-sm font-semibold text-cyan-200">{isSetup ? 'Ready to Start' : 'Starting interview...'}</p>
        </div>

        <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-8">
          <InterviewCameraFeed
            stream={stream}
            isCameraOn={isCameraOn}
            muted={true}
            className="mx-auto aspect-video w-full max-w-4xl rounded-2xl"
            placeholder={cameraLoading ? 'Starting camera...' : 'Camera is off'}
          />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onToggleMic}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isMicOn ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/40' : 'bg-red-500/20 text-red-200 ring-1 ring-red-300/40'
              }`}
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {isMicOn ? 'Mic On' : 'Mic Off'}
            </button>

            <button
              type="button"
              onClick={onToggleCamera}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isCameraOn ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-300/40' : 'bg-red-500/20 text-red-200 ring-1 ring-red-300/40'
              }`}
            >
              {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              {isCameraOn ? 'Camera On' : 'Camera Off'}
            </button>
          </div>

          {permissionError ? (
            <div className="mt-5 rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              {permissionError}
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onStart}
              disabled={starting || !stream}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-3 text-base font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="h-5 w-5" />
              {starting ? 'Starting...' : 'Start Interview'}
            </button>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4" />
              Interview starts in immersive fullscreen mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewJoinScreen;
