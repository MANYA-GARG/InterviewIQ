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
  name = 'Alex',
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

  // Mouth movement while speaking (randomized shapes, not true lip-sync)
  useEffect(() => {
    if (mode !== 'speaking') {
      setMouthOpen(0);
      return undefined;
    }
    const id = setInterval(() => setMouthOpen(Math.random() > 0.2 ? 0.25 + Math.random() * 0.75 : 0.05), 120);
    return () => clearInterval(id);
  }, [mode]);

  // Head movement: slight bob while speaking, tilt while listening
  useEffect(() => {
    if (mode === 'speaking') {
      const id = setInterval(
        () => setHead({ rot: (Math.random() - 0.5) * 3, y: Math.random() * 2 }),
        650
      );
      return () => clearInterval(id);
    }
    setHead(mode === 'listening' ? { rot: -3, y: 0 } : { rot: 0, y: 0 });
    return undefined;
  }, [mode]);

  // Random blinking
  useEffect(() => {
    let timeout;
    const scheduleBlink = () => {
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        scheduleBlink();
      }, 2500 + Math.random() * 2500);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  const pupil =
    mode === 'thinking' ? { x: 3, y: -3 } : mode === 'listening' ? { x: 0, y: 1 } : { x: 0, y: 0 };
  const eyeRy = blink ? 0.8 : 8;
  const browLift = mode === 'thinking' ? -4 : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {mode === 'listening' && (
          <div className="absolute -inset-2 animate-pulse rounded-full border-4 border-emerald-400/60" />
        )}
        {mode === 'speaking' && (
          <div className="absolute -inset-2 animate-pulse rounded-full border-4 border-sky-400/50" />
        )}

        <div className="h-56 w-56 overflow-hidden rounded-full bg-gradient-to-b from-indigo-900 to-slate-900 shadow-2xl ring-1 ring-white/20 md:h-64 md:w-64">
          <svg viewBox="0 0 240 260" className="h-full w-full" role="img" aria-label="AI interviewer avatar">
            {/* Suit, shirt, tie */}
            <path d="M20 260 C20 205 70 188 120 188 C170 188 220 205 220 260 Z" fill="#1e3a5f" />
            <path d="M100 190 L120 224 L140 190 Z" fill="#f1f5f9" />
            <path d="M115 206 L125 206 L128 246 L120 254 L112 246 Z" fill="#4f46e5" />

            {/* Neck */}
            <rect x="105" y="158" width="30" height="38" rx="10" fill="#e0ac86" />

            {/* Head group (moves) */}
            <g
              style={{
                transform: `translateY(${head.y}px) rotate(${head.rot}deg)`,
                transformOrigin: '120px 190px',
                transformBox: 'view-box',
                transition: 'transform 500ms ease-in-out',
              }}
            >
              {/* Ears and face */}
              <ellipse cx="68" cy="116" rx="7" ry="12" fill="#e0ac86" />
              <ellipse cx="172" cy="116" rx="7" ry="12" fill="#e0ac86" />
              <ellipse cx="120" cy="110" rx="52" ry="62" fill="#f0c29c" />

              {/* Hair */}
              <path
                d="M66 102 C60 50 100 36 120 36 C150 36 182 54 174 102 C168 78 150 66 120 66 C92 66 74 78 66 102 Z"
                fill="#1f2937"
              />

              {/* Eyebrows */}
              <g style={{ transform: `translateY(${browLift}px)`, transition: 'transform 300ms ease' }}>
                <path d="M92 90 Q103 84 114 89" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M126 89 Q137 84 148 90" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
              </g>

              {/* Eyes */}
              <ellipse cx="103" cy="108" rx="9" ry={eyeRy} fill="#fff" style={{ transition: 'ry 90ms' }} />
              <ellipse cx="137" cy="108" rx="9" ry={eyeRy} fill="#fff" style={{ transition: 'ry 90ms' }} />
              {!blink && (
                <g style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)`, transition: 'transform 300ms ease' }}>
                  <circle cx="103" cy="108" r="4.5" fill="#111827" />
                  <circle cx="137" cy="108" r="4.5" fill="#111827" />
                </g>
              )}

              {/* Nose and cheeks */}
              <path d="M120 112 Q115 128 122 130" stroke="#c98f69" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <circle cx="90" cy="130" r="8" fill="#f4a68a" opacity="0.25" />
              <circle cx="150" cy="130" r="8" fill="#f4a68a" opacity="0.25" />

              {/* Mouth */}
              {mode === 'speaking' ? (
                <ellipse
                  cx="120"
                  cy="147"
                  rx="11"
                  ry={2 + mouthOpen * 9}
                  fill="#7f1d1d"
                  style={{ transition: 'ry 100ms' }}
                />
              ) : (
                <path
                  d={mode === 'thinking' ? 'M108 148 Q120 148 132 148' : 'M106 144 Q120 156 134 144'}
                  stroke="#9b3b3b"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </g>
          </svg>
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