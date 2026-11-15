import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

const STATUS_LABEL = {
  speaking: 'Speaking…',
  thinking: 'Thinking…',
  listening: 'Listening…',
  idle: 'Ready',
};

const InterviewerAvatar = ({
  voiceState = 'IDLE',
  isListening = false,
  isThinking = false,
  onRepeat,
  name = 'Maya',
  imageSrc = '',
}) => {
  const mode =
    voiceState === 'SPEAKING'
      ? 'speaking'
      : isThinking || voiceState === 'PROCESSING'
      ? 'thinking'
      : isListening || voiceState === 'LISTENING'
      ? 'listening'
      : 'idle';

  const [mouthOpen, setMouthOpen] = useState(0);
  const [blink, setBlink] = useState(false);
  const [head, setHead] = useState({ rot: 0, y: 0 });

  useEffect(() => {
    if (mode !== 'speaking') {
      setMouthOpen(0);
      return undefined;
    }
    const id = setInterval(
      () => setMouthOpen(Math.random() > 0.2 ? 0.25 + Math.random() * 0.75 : 0.05),
      120
    );
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode === 'speaking') {
      const id = setInterval(
        () => setHead({ rot: (Math.random() - 0.5) * 3, y: Math.random() * 2.5 }),
        650
      );
      return () => clearInterval(id);
    }
    setHead(mode === 'listening' ? { rot: -3, y: 0 } : { rot: 0, y: 0 });
    return undefined;
  }, [mode]);

  useEffect(() => {
    let timeout;
    let inner;
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlink(true);
        inner = setTimeout(() => setBlink(false), 130);
        schedule();
      }, 2500 + Math.random() * 2500);
    };
    schedule();
    return () => {
      clearTimeout(timeout);
      clearTimeout(inner);
    };
  }, []);

  const pupil =
    mode === 'thinking' ? { x: 3, y: -3 } : mode === 'listening' ? { x: 0, y: 1 } : { x: 0, y: 0 };
  const eyeRy = blink ? 0.8 : 8.5;
  const browLift = mode === 'thinking' ? -4 : 0;

  const ring =
    mode === 'listening' ? (
      <div className="absolute -inset-2 animate-pulse rounded-3xl border-4 border-emerald-400/60" />
    ) : mode === 'speaking' ? (
      <div className="absolute -inset-2 animate-pulse rounded-3xl border-4 border-sky-400/50" />
    ) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {ring}

        <div className="h-64 w-56 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20 md:h-80 md:w-64">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="AI interviewer"
              className="h-full w-full object-cover"
              style={{
                transform: `translateY(${head.y}px) scale(${mode === 'speaking' ? 1.02 : 1})`,
                transition: 'transform 500ms ease-in-out',
              }}
            />
          ) : (
            <svg viewBox="0 0 300 340" className="h-full w-full" role="img" aria-label="AI interviewer avatar">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0e7490" />
                  <stop offset="55%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8a3b1f" />
                  <stop offset="60%" stopColor="#c0572a" />
                  <stop offset="100%" stopColor="#e08a3c" />
                </linearGradient>
                <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f8d2b0" />
                  <stop offset="100%" stopColor="#eeb48f" />
                </linearGradient>
                <radialGradient id="glow" cx="0.3" cy="0.3" r="0.8">
                  <stop offset="0%" stopColor="#fde68a" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="300" height="340" fill="url(#bg)" />
              <rect width="300" height="340" fill="url(#glow)" />

              {/* Hair (back) */}
              <path
                d="M68 150 C50 40 130 14 150 14 C178 14 252 44 234 160 C242 232 254 292 248 340 L52 340 C48 292 62 222 68 150 Z"
                fill="url(#hair)"
              />

              {/* Blazer and blouse */}
              <path d="M36 340 C42 284 96 262 150 262 C204 262 258 284 264 340 Z" fill="#1e3a4c" />
              <path d="M122 264 L150 306 L178 264 Z" fill="#f6eadc" />
              <path d="M122 264 L150 306 L138 340 L100 340 Z" fill="#183041" />
              <path d="M178 264 L150 306 L162 340 L200 340 Z" fill="#183041" />

              {/* Neck */}
              <rect x="130" y="212" width="40" height="58" rx="14" fill="#e6a982" />

              {/* Head (moves) */}
              <g
                style={{
                  transform: `translateY(${head.y}px) rotate(${head.rot}deg)`,
                  transformOrigin: '150px 250px',
                  transformBox: 'view-box',
                  transition: 'transform 500ms ease-in-out',
                }}
              >
                {/* Face */}
                <ellipse cx="150" cy="148" rx="58" ry="72" fill="url(#skin)" />

                {/* Hair strands framing the face */}
                <path
                  d="M92 150 C84 74 126 50 158 52 C126 68 108 100 102 156 C98 176 94 168 92 150 Z"
                  fill="url(#hair)"
                />
                <path
                  d="M208 150 C216 78 190 52 158 52 C190 76 200 104 204 156 C206 172 210 166 208 150 Z"
                  fill="url(#hair)"
                />
                <path
                  d="M96 100 C110 62 150 46 182 62 C150 58 120 76 104 112 Z"
                  fill="#a8481f"
                  opacity="0.8"
                />

                {/* Blush */}
                <ellipse cx="112" cy="168" rx="12" ry="7" fill="#f08a7a" opacity="0.28" />
                <ellipse cx="188" cy="168" rx="12" ry="7" fill="#f08a7a" opacity="0.28" />

                {/* Eyebrows */}
                <g style={{ transform: `translateY(${browLift}px)`, transition: 'transform 300ms ease' }}>
                  <path d="M104 122 Q122 111 141 120" stroke="#5a2d1c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                  <path d="M159 120 Q178 111 196 122" stroke="#5a2d1c" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                </g>

                {/* Eyes */}
                <ellipse cx="124" cy="143" rx="12" ry={eyeRy} fill="#fff" style={{ transition: 'ry 90ms' }} />
                <ellipse cx="176" cy="143" rx="12" ry={eyeRy} fill="#fff" style={{ transition: 'ry 90ms' }} />
                {!blink && (
                  <g style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)`, transition: 'transform 300ms ease' }}>
                    <circle cx="124" cy="143" r="7" fill="#4b6a78" />
                    <circle cx="176" cy="143" r="7" fill="#4b6a78" />
                    <circle cx="124" cy="143" r="3.6" fill="#0f172a" />
                    <circle cx="176" cy="143" r="3.6" fill="#0f172a" />
                    <circle cx="127" cy="140" r="1.8" fill="#fff" />
                    <circle cx="179" cy="140" r="1.8" fill="#fff" />
                  </g>
                )}
                {/* Upper lids and lashes */}
                <path d="M110 140 Q124 128 138 140" stroke="#3b1f14" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M162 140 Q176 128 190 140" stroke="#3b1f14" strokeWidth="3" fill="none" strokeLinecap="round" />

                {/* Nose */}
                <path d="M150 150 Q144 172 154 175" stroke="#c98a68" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                {/* Mouth */}
                {mode === 'speaking' ? (
                  <g>
                    <ellipse cx="150" cy="194" rx="13" ry={2 + mouthOpen * 10} fill="#6b1f24" style={{ transition: 'ry 100ms' }} />
                    <path d="M136 192 Q150 188 164 192" stroke="#d9645c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  </g>
                ) : (
                  <g>
                    <path
                      d={mode === 'thinking' ? 'M137 194 Q150 194 163 194' : 'M135 191 Q150 204 165 191'}
                      stroke="#c4524f"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </g>
            </svg>
          )}
        </div>

        {mode === 'thinking' && (
          <div className="absolute -right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 shadow-lg">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-slate-500"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">{name} · AI Interviewer</p>
        <p className="text-xs text-sky-200" aria-live="polite">{STATUS_LABEL[mode]}</p>
      </div>

      {onRepeat && (
        <button
          type="button"
          onClick={onRepeat}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100 ring-1 ring-white/15 hover:bg-white/20"
        >
          <Volume2 className="h-3.5 w-3.5" />
          Repeat Question
        </button>
      )}
    </div>
  );
};

export default InterviewerAvatar;