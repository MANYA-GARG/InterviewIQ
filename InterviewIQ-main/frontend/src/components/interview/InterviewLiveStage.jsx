import {
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  Clock3,
  Mic,
  MicOff,
  Square,
  CheckCircle2,
  Volume2,
  X,
} from 'lucide-react';
import InterviewCameraFeed from './InterviewCameraFeed';
import InterviewerAvatar from './InterviewerAvatar';

const InterviewLiveStage = ({
  question,
  currentIndex,
  totalQuestions,
  stream,
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  questionTimeLeft,
  formatTime,
  answerMode,
  onAnswerModeChange,
  answerText,
  onAnswerTextChange,
  isListening,
  voiceState,
  speechSupported,
  liveTranscript,
  onToggleListening,
  onRepeatQuestion,
  onNext,
  onSkip,
  onMarkForReview,
  isMarked,
  isSubmitting,
  isLastQuestion,
  status,
  warningCount,
  isFullscreen,
  onToggleFullscreen,
  onEndInterview,
  cameraStatus,
  recordingStatus,
}) => {
  const timerIsLow = questionTimeLeft <= 20;
  const isVoiceBlocked = voiceState === 'SPEAKING' || voiceState === 'PROCESSING';
  const voiceStatusLabel =
    voiceState === 'LISTENING'
      ? 'Listening...'
      : voiceState === 'PROCESSING'
      ? 'Processing...'
      : voiceState === 'SPEAKING'
      ? 'AI Speaking...'
      : 'Idle';

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100">
      <header className="px-4 pt-4 md:px-10">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/10">
              <span className={`h-2.5 w-2.5 rounded-full ${recordingStatus === 'recording' ? 'bg-red-400 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-semibold">Recording</span>
            </div>

            <p className="text-center text-sm font-semibold text-sky-200">
              Question {currentIndex + 1}/{totalQuestions}
            </p>

            <div className="flex items-center justify-end gap-2">
              <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${timerIsLow ? 'bg-rose-500/30 text-rose-100' : 'bg-white/15 text-sky-100'} ring-1 ring-white/10`}>
                <Clock3 className="h-3.5 w-3.5" />
                {formatTime(questionTimeLeft)}
              </div>
              <button
                type="button"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold ring-1 ring-white/20 hover:bg-white/25"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <h2 className="mx-auto mt-3 max-w-4xl text-center text-xl font-semibold leading-relaxed md:text-2xl">
            {question?.questionText || 'Loading question...'}
          </h2>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-4 md:flex-row md:px-10">
        <div className="flex min-h-[44vh] w-full items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800/60 to-slate-950/60 py-6 md:h-[58vh] md:w-[62%]">
          <InterviewerAvatar
            voiceState={voiceState}
            isListening={isListening}
            isThinking={isSubmitting}
            onRepeat={onRepeatQuestion}
          />
        </div>

        <div className="w-full md:w-[30%]">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-300">You</p>
          <InterviewCameraFeed
            stream={stream}
            isCameraOn={isCameraOn}
            muted
            className="aspect-video w-full rounded-2xl border border-white/15 bg-black/20 shadow-2xl"
            placeholder="Enable camera to continue"
          />
        </div>
      </main>

      <section className="border-t border-white/15 bg-white/5 px-4 pb-6 pt-4 backdrop-blur-xl md:px-10">
        <div className="mx-auto max-w-6xl space-y-4 rounded-2xl border border-white/15 bg-black/20 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <div className="rounded-full bg-white/15 px-3 py-1.5">
              Status: <span className="font-semibold text-sky-200 capitalize">{status}</span>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1.5">
              Voice: <span className="font-semibold text-cyan-200">{voiceStatusLabel}</span>
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1.5">
              Camera: <span className="font-semibold text-emerald-200 capitalize">{cameraStatus}</span>
            </div>
            {warningCount > 0 ? (
              <div className="rounded-full bg-amber-500/20 px-3 py-1.5 text-amber-200">
                Tab warnings: {warningCount}/3
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label className="text-xs uppercase tracking-wide text-slate-300">Answer Input</label>
              <textarea
                value={answerText}
                onChange={(event) => onAnswerTextChange(event.target.value)}
                placeholder={answerMode === 'voice' ? 'Live voice transcription will appear here...' : 'Type your answer...'}
                className="mt-2 h-24 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white outline-none focus:border-sky-400"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label className="text-xs uppercase tracking-wide text-slate-300">Live Transcript</label>
              <div className="mt-2 h-24 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                {answerMode === 'voice' ? liveTranscript || 'Transcript will appear while speaking...' : 'Switch to voice mode to use speech-to-text.'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onAnswerModeChange('text')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${answerMode === 'text' ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-200'}`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => onAnswerModeChange('voice')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${answerMode === 'voice' ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-200'}`}
              >
                Voice
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                disabled={isSubmitting}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-slate-100 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={onMarkForReview}
                disabled={isSubmitting}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${isMarked ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-100'}`}
              >
                {isMarked ? 'Marked' : 'Mark'}
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isLastQuestion ? 'Review Answers' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/15 bg-black/40 p-4 backdrop-blur-xl shadow-lg">
          <button
            type="button"
            onClick={onToggleListening}
            disabled={answerMode !== 'voice' || !speechSupported || !isMicOn || isVoiceBlocked}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${isListening ? 'bg-red-500/80 text-white' : 'bg-sky-500/80 text-white'} disabled:opacity-50`}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onToggleMic}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${isMicOn ? 'bg-emerald-500/25 text-emerald-100' : 'bg-red-500/25 text-red-100'}`}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onToggleCamera}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${isCameraOn ? 'bg-emerald-500/25 text-emerald-100' : 'bg-red-500/25 text-red-100'}`}
            title={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sky-100"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onEndInterview}
            title="End Interview"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-500/30 text-red-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default InterviewLiveStage;
