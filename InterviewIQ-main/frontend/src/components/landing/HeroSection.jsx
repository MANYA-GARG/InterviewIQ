import { useNavigate } from 'react-router-dom';
import {
  PlayCircle,
  Upload,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react';

const PILLS = [
  'AI-Generated Questions',
  'Resume Skill Analysis',
  'Real-Time Scoring',
  'Camera Proctoring',
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 pt-28 pb-0 lg:pt-36">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
      >
        <div className="mt-[-80px] h-[600px] w-[900px] rounded-full bg-primary-600/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Groq AI — Practice Interviews Like a Pro
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-center text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          AI-Powered{' '}
          <span className="bg-gradient-to-r from-primary-400 to-indigo-300 bg-clip-text text-transparent">
            Interview Preparation
          </span>{' '}
          Platform
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-slate-400 sm:text-lg">
          Upload your resume, get instant skill analysis, and practice AI-driven mock
          interviews with real-time feedback — all in one platform.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-900/30 hover:bg-primary-500 transition-all hover:-translate-y-0.5"
          >
            <PlayCircle className="h-5 w-5" />
            Start Interview
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-7 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-700 transition-all hover:-translate-y-0.5"
          >
            <Upload className="h-5 w-5" />
            Upload Resume
          </button>
        </div>

        {/* Trust pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {PILLS.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              {p}
            </span>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-500">
          <div className="flex -space-x-2">
            {['AS', 'MR', 'PK', 'JL', 'SK'].map((init) => (
              <div
                key={init}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-800 bg-gradient-to-br from-primary-500 to-indigo-600 text-[10px] font-bold text-white"
              >
                {init}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </div>
          <span>
            Trusted by <strong className="text-slate-300">10,000+</strong> candidates
          </span>
        </div>

        {/* Mock dashboard preview strip */}
        <div className="relative mt-16 mx-auto max-w-5xl">
          <div className="rounded-t-2xl border border-slate-700/60 bg-slate-800/80 backdrop-blur shadow-2xl shadow-black/40 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-slate-700/60 bg-slate-900/60 px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-4 text-xs text-slate-500">interviewiq.app/interview/session</span>
            </div>
            {/* Mock interview UI */}
            <div className="grid grid-cols-[220px,1fr] gap-0 min-h-[260px]">
              {/* Sidebar stub */}
              <div className="border-r border-slate-700/50 bg-slate-900/50 p-4 space-y-2">
                {['Dashboard','Upload Resume','Start Interview','History','Reports','Profile'].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                      i === 2 ? 'bg-primary-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 2 ? 'bg-white' : 'bg-slate-600'}`} />
                    {item}
                  </div>
                ))}
              </div>
              {/* Content stub */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <PlayCircle className="h-4 w-4 text-primary-400" />
                  </div>
                  <div>
                    <div className="h-3 w-40 rounded bg-slate-700 mb-1" />
                    <div className="h-2 w-24 rounded bg-slate-800" />
                  </div>
                  <span className="ml-auto rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-700/30">
                    In Progress
                  </span>
                </div>
                {/* Question card */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-2">Question 2 / 5</p>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full rounded bg-slate-700" />
                    <div className="h-2.5 w-4/5 rounded bg-slate-700" />
                    <div className="h-2.5 w-3/5 rounded bg-slate-700" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-1.5 w-2/5 rounded-full bg-gradient-to-r from-primary-500 to-indigo-400" />
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <div className="h-7 w-20 rounded-lg bg-slate-700" />
                  <div className="h-7 w-28 rounded-lg bg-primary-600/60" />
                </div>
              </div>
            </div>
          </div>
          {/* Fade at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-800" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
