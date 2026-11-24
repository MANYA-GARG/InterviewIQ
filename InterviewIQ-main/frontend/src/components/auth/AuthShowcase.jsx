import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Mic,
  ShieldCheck,
  Users,
  Volume2,
  Zap,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Tumbling glass die + pop-out cards (decorative, aria-hidden)               */
/* -------------------------------------------------------------------------- */

const STAGE_W = 560;
const STAGE_H = 460;
const ROLL_MS = 1900; // how long the die tumbles before cards pop out
const CYCLE_MS = 5600; // one full scene

const mod = (a) => ((a % 360) + 360) % 360;

/* ---- Pop-out cards ------------------------------------------------------- */

const Bar = ({ label, value, color }) => (
  <div className="aq-bar">
    <div className="aq-bar-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
    <div className="aq-track">
      <div className="aq-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

const LiveCard = () => (
  <>
    <div className="aq-card-head">
      <span className="aq-dot" /> Live interview · Q3 of 8
    </div>
    <p className="aq-card-title">Walk me through a time you debugged a production issue.</p>
    <Bar label="Answer clarity" value={86} color="#a5b4fc" />
    <Bar label="Relevance to role" value={91} color="#6ee7b7" />
  </>
);

const ResumeCard = () => (
  <>
    <div className="aq-card-head">Resume analysis</div>
    <div className="aq-score">
      82<small> / 100 ATS score</small>
    </div>
    <div className="aq-chips">
      <span className="aq-chip aq-ok">React</span>
      <span className="aq-chip aq-ok">Node.js</span>
      <span className="aq-chip aq-miss">Docker</span>
    </div>
  </>
);

const FeedbackCard = () => (
  <>
    <div className="aq-card-head">Answer feedback</div>
    <div className="aq-line">
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#6ee7b7' }} />
      Clear structure and technical depth.
    </div>
    <div className="aq-line">
      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#fcd34d' }} />
      Add a measurable result to close.
    </div>
  </>
);

const ProgressCard = () => (
  <>
    <div className="aq-card-head">Progress report</div>
    <div className="aq-score">
      8.4<small> / 10 overall</small>
    </div>
    <div className="aq-spark">
      {[38, 52, 46, 68, 84].map((h, i) => (
        <i key={i} style={{ height: `${h}%`, background: i === 4 ? '#a5b4fc' : 'rgba(255,255,255,.3)' }} />
      ))}
    </div>
  </>
);

const VoiceCard = () => (
  <>
    <div className="aq-card-head">Voice interview mode</div>
    <div className="aq-wave">
      {Array.from({ length: 14 }).map((_, i) => (
        <i key={i} style={{ animationDelay: `${(i % 7) * 0.12}s` }} />
      ))}
    </div>
    <p className="aq-card-sub">Speak your answer. Get it transcribed and scored.</p>
  </>
);

const ProctorCard = () => (
  <>
    <div className="aq-card-head">Real-time proctoring</div>
    {['Camera connected', 'One face in frame', 'Tab focus stable'].map((t) => (
      <div className="aq-line" key={t}>
        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#6ee7b7' }} />
        {t}
      </div>
    ))}
  </>
);

/* ---- Scenes: one per die face (copy taken from the landing page) -------- */

const SCENES = [
  {
    id: 'interviews', ori: [0, 0], icon: Mic, big: '10,000+', label: 'Interviews practiced',
    slot: 'tl', Card: LiveCard,
    aside: (<>Direct access to <b>real interview questions</b></>),
  },
  {
    id: 'resume', ori: [0, -90], icon: FileText, big: 'AI Resume', label: 'Skill analyzer',
    slot: 'tr', Card: ResumeCard,
    aside: (<>Skills matched to <b>the job description</b></>),
  },
  {
    id: 'feedback', ori: [0, -180], icon: Zap, big: 'Real-Time', label: 'Interview feedback',
    slot: 'bl', Card: FeedbackCard,
    aside: (<>Feedback after <b>every single answer</b></>),
  },
  {
    id: 'satisfaction', ori: [0, 90], icon: Users, big: '95%', label: 'Candidate satisfaction',
    slot: 'br', Card: ProgressCard,
    aside: (<>See your <b>progress across sessions</b></>),
  },
  {
    id: 'voice', ori: [-90, 0], icon: Volume2, big: 'Voice', label: 'Interview mode',
    slot: 'tl', Card: VoiceCard,
    aside: (<>Answer out loud, <b>like the real thing</b></>),
  },
  {
    id: 'proctoring', ori: [90, 0], icon: ShieldCheck, big: 'Live', label: 'Proctoring',
    slot: 'tr', Card: ProctorCard,
    aside: (<>Practice under <b>real interview conditions</b></>),
  },
];

// die face -> CSS placement
const FACE_POS = ['front', 'right', 'back', 'left', 'top', 'bottom'];

const CSS = `
.aq-stage { position: absolute; left: 50%; top: 0; width: ${STAGE_W}px; height: ${STAGE_H}px; margin-left: -${STAGE_W / 2}px; transform-origin: top center; }

/* die */
.aq-float { position: absolute; left: ${STAGE_W / 2 - 100}px; top: 112px; width: 200px; height: 200px; animation: aq-bob 5s ease-in-out infinite; }
.aq-persp { width: 100%; height: 100%; perspective: 1000px; }
.aq-tilt { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transform: rotateX(-20deg) rotateY(-28deg); }
.aq-roll { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform ${ROLL_MS - 100}ms cubic-bezier(.55,.03,.12,1); }
@keyframes aq-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }

.aq-face { position: absolute; inset: 0; box-sizing: border-box; padding: 18px; border-radius: 28px; color: #fff;
  display: flex; flex-direction: column; justify-content: space-between;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: linear-gradient(150deg, rgba(165,180,252,.34) 0%, rgba(99,102,241,.16) 42%, rgba(15,23,42,.62) 100%);
  border: 1px solid rgba(199,210,254,.5);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), inset 0 0 34px rgba(129,140,248,.26); }
.aq-face::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(120deg, rgba(255,255,255,.2) 0%, rgba(255,255,255,0) 32%); }
.aq-front  { transform: translateZ(100px); }
.aq-right  { transform: rotateY(90deg)  translateZ(100px); }
.aq-back   { transform: rotateY(180deg) translateZ(100px); }
.aq-left   { transform: rotateY(-90deg) translateZ(100px); }
.aq-top    { transform: rotateX(90deg)  translateZ(100px); }
.aq-bottom { transform: rotateX(-90deg) translateZ(100px); }
.aq-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.3); }
.aq-big { font-size: 33px; font-weight: 800; line-height: 1.05; letter-spacing: -.02em; text-shadow: 0 2px 14px rgba(15,23,42,.6); }
.aq-lbl { margin-top: 5px; font-size: 13px; font-weight: 600; color: rgba(224,231,255,.92); }

.aq-core { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; transform-style: preserve-3d; }
.aq-core i { position: absolute; inset: 0; border-radius: 12px; background: rgba(99,102,241,.42); box-shadow: 0 0 34px rgba(99,102,241,.9); }
.aq-core i:nth-child(1) { transform: translateZ(30px); }
.aq-core i:nth-child(2) { transform: rotateY(90deg) translateZ(30px); }
.aq-core i:nth-child(3) { transform: rotateX(90deg) translateZ(30px); }

.aq-floor { position: absolute; left: ${STAGE_W / 2 - 150}px; top: 340px; width: 300px; height: 58px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(2,6,23,.7), rgba(2,6,23,0)); }
.aq-ring { position: absolute; left: ${STAGE_W / 2 - 125}px; top: 350px; width: 250px; height: 42px; border-radius: 50%;
  border: 1px solid rgba(129,140,248,.34); box-shadow: 0 0 26px rgba(99,102,241,.28); }

/* pop-out cards */
.aq-pop { position: absolute; width: 214px; box-sizing: border-box; padding: 14px; border-radius: 16px; color: #fff;
  background: linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05));
  border: 1px solid rgba(199,210,254,.34); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(2,6,23,.45);
  opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.42); transition: opacity .35s ease, transform .6s cubic-bezier(.2,.9,.3,1.15); pointer-events: none; }
.aq-pop[data-on='true'] { opacity: 1; transform: none; }
.aq-tl { left: 0; top: 4px; --dx: 174px; --dy: 154px; }
.aq-tr { right: 0; top: 4px; --dx: -174px; --dy: 154px; }
.aq-bl { left: 0; bottom: 4px; --dx: 174px; --dy: -160px; }
.aq-br { right: 0; bottom: 4px; --dx: -174px; --dy: -160px; }

.aq-aside { position: absolute; top: 196px; width: 150px; padding: 9px 12px; border-radius: 12px; font-size: 12px; line-height: 1.35; color: rgba(224,231,255,.95);
  background: rgba(255,255,255,.08); border: 1px solid rgba(199,210,254,.26); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
  opacity: 0; transition: opacity .4s ease .12s, transform .5s ease .12s; }
.aq-aside b { color: #fff; font-weight: 700; }
.aq-aside-l { left: 0; transform: translateX(-14px); }
.aq-aside-r { right: 0; transform: translateX(14px); }
.aq-aside[data-on='true'] { opacity: 1; transform: none; }

.aq-card-head { display: flex; align-items: center; gap: 7px; font-size: 11.5px; font-weight: 700; color: rgba(224,231,255,.92); }
.aq-dot { width: 7px; height: 7px; border-radius: 99px; background: #fb7185; box-shadow: 0 0 0 3px rgba(251,113,133,.25); }
.aq-card-title { margin: 8px 0 4px; font-size: 12.5px; font-weight: 700; line-height: 1.3; }
.aq-card-sub { margin: 8px 0 0; font-size: 12px; line-height: 1.35; color: rgba(224,231,255,.85); }
.aq-bar { margin-top: 8px; }
.aq-bar-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; color: rgba(224,231,255,.9); }
.aq-track { height: 5px; border-radius: 99px; background: rgba(255,255,255,.18); overflow: hidden; }
.aq-fill { height: 100%; border-radius: 99px; }
.aq-score { margin-top: 8px; font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -.03em; }
.aq-score small { font-size: 12px; font-weight: 600; letter-spacing: 0; color: rgba(224,231,255,.8); }
.aq-chips { margin-top: 10px; }
.aq-chip { display: inline-block; margin: 0 5px 5px 0; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24); }
.aq-ok { background: rgba(52,211,153,.22); border-color: rgba(52,211,153,.5); }
.aq-miss { background: rgba(251,191,36,.2); border-color: rgba(251,191,36,.5); }
.aq-line { display: flex; gap: 7px; margin-top: 9px; font-size: 12px; line-height: 1.35; }
.aq-spark { display: flex; align-items: flex-end; gap: 6px; height: 34px; margin-top: 10px; }
.aq-spark i { flex: 1; border-radius: 4px; }
.aq-wave { display: flex; align-items: center; gap: 4px; height: 38px; margin-top: 10px; }
.aq-wave i { flex: 1; height: 100%; border-radius: 99px; background: #a5b4fc; transform-origin: center; animation: aq-wave 1.1s ease-in-out infinite; }
@keyframes aq-wave { 0%, 100% { transform: scaleY(.22); } 50% { transform: scaleY(1); } }

@media (prefers-reduced-motion: reduce) {
  .aq-float, .aq-wave i { animation: none; }
  .aq-roll, .aq-pop, .aq-aside { transition: none; }
}
`;

const CubeStage = () => {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('roll');
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const rotRef = useRef({ x: 0, y: 0 });
  const wrapRef = useRef(null);

  /* Tumble to the next face, then pop its cards out */
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timers = [];

    if (reduced) {
      setPhase('show');
      return undefined;
    }

    timers.push(setTimeout(() => setPhase('show'), 700));

    let n = 0;
    const roll = () => {
      n = (n + 1) % SCENES.length;
      const [tx, ty] = SCENES[n].ori;
      const prev = rotRef.current;
      // always spin at least a full turn on both axes so it reads as a roll
      const next = {
        x: prev.x + 360 + mod(tx - prev.x),
        y: prev.y + 720 + mod(ty - prev.y),
      };
      rotRef.current = next;
      setRot(next);
      setPhase('roll');
      setStep(n);
      timers.push(setTimeout(() => setPhase('show'), ROLL_MS));
    };

    const id = setInterval(roll, CYCLE_MS);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
    };
  }, []);

  /* Fit the stage to its column */
  useEffect(() => {
    const update = () => {
      const w = wrapRef.current?.clientWidth || STAGE_W;
      setScale(Math.max(0.5, Math.min(1, w / STAGE_W)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: STAGE_H * scale }} aria-hidden="true">
      <style>{CSS}</style>
      <div className="aq-stage" style={{ transform: `scale(${scale})` }}>
        <div className="aq-floor" />
        <div className="aq-ring" />

        <div className="aq-float">
          <div className="aq-persp">
            <div className="aq-tilt">
              <div className="aq-roll" style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
                <div className="aq-core">
                  <i /><i /><i />
                </div>
                {SCENES.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.id} className={`aq-face aq-${FACE_POS[i]}`}>
                      <span className="aq-icon">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="aq-big">{s.big}</div>
                        <div className="aq-lbl">{s.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {SCENES.map((s, i) => {
          const on = phase === 'show' && step === i;
          const side = s.slot.endsWith('l') ? 'r' : 'l';
          return (
            <div key={s.id}>
              <div className={`aq-pop aq-${s.slot}`} data-on={on}>
                <s.Card />
              </div>
              <div className={`aq-aside aq-aside-${side}`} data-on={on}>
                {s.aside}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CubeStage;
