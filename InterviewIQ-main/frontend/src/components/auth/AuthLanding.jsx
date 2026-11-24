import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  FileText,
  Lock,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  Upload,
  PlayCircle,
  TrendingUp,
  X,
} from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import EmailAuthForm from './EmailAuthForm';
import CubeStage from './AuthShowcase';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';

const NAV_LINKS = [
  { label: 'Features', target: 'features' },
  { label: 'Product tour', target: 'tour' },
  { label: 'How it works', target: 'how-it-works' },
];

const PRACTICE_FOR = [
  'Frontend Developer', 'Backend Developer', 'Full-stack Engineer', 'Data Analyst', 'DevOps Engineer',
  'Machine Learning', 'Software Engineer', 'System Design', 'DSA and algorithms', 'Behavioral rounds', 'HR rounds',
];

const FEATURES = [
  {
    icon: FileText, title: 'Smart Resume Analyzer', color: 'text-sky-600', bg: 'bg-sky-50',
    text: 'Upload your PDF or DOCX resume. Our AI extracts skills, scores your profile, identifies gaps, and provides targeted improvement suggestions.',
  },
  {
    icon: BrainCircuit, title: 'AI Interview Simulator', color: 'text-primary-600', bg: 'bg-primary-50',
    text: 'Practice with Groq-powered AI that generates role-specific questions based on your experience level, then scores every answer in detail.',
  },
  {
    icon: ShieldCheck, title: 'Real-Time Proctoring', color: 'text-violet-600', bg: 'bg-violet-50',
    text: 'Webcam preview and tab-switch detection keep your sessions focused. Automated warnings enforce a real interview-like environment.',
  },
  {
    icon: BarChart3, title: 'Progress Reports', color: 'text-emerald-600', bg: 'bg-emerald-50',
    text: 'Interactive score trend charts, category breakdowns (technical, communication, problem-solving), and role-wise interview history.',
  },
  {
    icon: Mic, title: 'Voice Interview Mode', color: 'text-amber-600', bg: 'bg-amber-50',
    text: 'Answer questions verbally. Your audio is transcribed in real time with per-question countdown timers.',
  },
  {
    icon: Lock, title: 'Secure OTP Auth', color: 'text-rose-600', bg: 'bg-rose-50',
    text: 'Email OTP verification, JWT access tokens, and refresh-token rotation guard your account and sessions end-to-end.',
  },
];

const STEPS = [
  { icon: Upload, title: 'Upload your resume', text: 'Upload a PDF or DOCX resume. Our parser extracts the text and sends it to the skill analysis engine instantly.' },
  { icon: BrainCircuit, title: 'Get your AI skill analysis', text: 'See your detected skills, the skills missing for your target role, and a resume score with actionable suggestions.' },
  { icon: PlayCircle, title: 'Practice AI interviews', text: 'Pick a job role and experience level. Answer by text or voice, with a timer on every question.' },
  { icon: TrendingUp, title: 'Track your improvement', text: 'View score trends, category breakdowns and detailed AI-written feedback to speed up your preparation.' },
];

const SKILL_BARS = [
  { label: 'Technical depth', value: 88, color: 'bg-indigo-400' },
  { label: 'Communication', value: 82, color: 'bg-emerald-400' },
  { label: 'Problem solving', value: 79, color: 'bg-sky-400' },
  { label: 'Confidence', value: 74, color: 'bg-amber-400' },
];

const PAGE_CSS = `
.al-marquee { animation: al-scroll 48s linear infinite; }
.al-marquee:hover { animation-play-state: paused; }
@keyframes al-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .al-marquee { animation: none; } }
`;

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const AuthLanding = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [emailOpen, setEmailOpen] = useState(initialMode === 'register');
  const [googleError, setGoogleError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  /* One page, two modes: keep the address bar in step without a page change */
  const changeMode = (next) => {
    setMode(next);
    try {
      window.history.replaceState(window.history.state, '', next === 'login' ? '/login' : '/register');
    } catch (e) { /* ignore */ }
  };

  const openAuth = (next) => {
    changeMode(next);
    setEmailOpen(true);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('auth-email')?.focus({ preventScroll: true }), 450);
  };

  const goTo = (id) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      <style>{PAGE_CSS}</style>

      {/* ------------------------------ Navigation ------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
            aria-label="InterviewIQ home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <BrainCircuit className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">InterviewIQ</span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.target}
                type="button"
                onClick={() => goTo(l.target)}
                className="text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:text-white"
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              Get started
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-slate-950 px-4 pb-5 pt-3 md:hidden">
            {NAV_LINKS.map((l) => (
              <button
                key={l.target}
                type="button"
                onClick={() => goTo(l.target)}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                {l.label}
              </button>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => openAuth('login')} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold">
                Sign in
              </button>
              <button type="button" onClick={() => openAuth('register')} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold">
                Get started
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* --------------------------------- Hero --------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary-600/20 blur-[120px]" />
          <div className="absolute right-[-10%] top-1/3 h-[420px] w-[520px] rounded-full bg-violet-600/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8 lg:py-20">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Walk in
              <br />
              when you are
              <br />
              <span className="text-indigo-300">ready.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
              Practice with an AI interviewer, fix your resume, and see exactly where you stand, so the real
              interview feels familiar.
            </p>

            <p className="mt-9 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Start free. Takes 30 seconds.
            </p>
            <div className="mt-3 max-w-[400px]">
              <GoogleAuthButton
                pill
                text={mode === 'login' ? 'continue_with' : 'signup_with'}
                fallbackLabel="Continue with Google"
                onError={setGoogleError}
              />
            </div>

            <button
              type="button"
              onClick={() => setEmailOpen((v) => !v)}
              aria-expanded={emailOpen}
              aria-controls="email-auth"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              or continue with email
              <ChevronDown className={`h-4 w-4 transition-transform ${emailOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              id="email-auth"
              className={`grid max-w-[400px] transition-[grid-template-rows] duration-300 ease-out ${
                emailOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className={`pt-4 ${emailOpen ? '' : 'invisible'}`} aria-hidden={!emailOpen}>
                  <EmailAuthForm mode={mode} onModeChange={changeMode} externalError={googleError} />
                </div>
              </div>
            </div>

            <p className="mt-8 flex items-center gap-2 text-sm text-slate-400">
              <Sparkles className="h-4 w-4 text-indigo-300" />
              <span>
                <strong className="font-semibold text-slate-200">10,000+</strong> interviews practiced
                <span className="mx-2 text-slate-600">|</span>
                <strong className="font-semibold text-slate-200">95%</strong> candidate satisfaction
              </span>
            </p>
          </div>

          <CubeStage />
        </div>

        {/* Practice-for strip */}
        <div className="relative border-t border-white/10 bg-slate-950/40 py-5">
          <div className="mx-auto mb-3 max-w-7xl px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:px-6 lg:px-8">
            Practice for
          </div>
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="al-marquee flex w-max">
              {[...PRACTICE_FOR, ...PRACTICE_FOR].map((r, i) => (
                <span key={`${r}-${i}`} className="pr-3">
                  <span className="inline-block whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300">
                    {r}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- Features ------------------------------- */}
      <section id="features" className="bg-slate-50 py-24 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need before the real interview.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From resume analysis to the final evaluation, each step is clear, measurable and built around
              your target role.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className={`inline-flex rounded-xl p-3 ${f.bg}`}>
                    <Icon className={`h-6 w-6 ${f.color}`} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------ Product tour ----------------------------- */}
      <section id="tour" className="bg-slate-900 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
              A real interview.
              <br />
              A real report.
            </h2>
            <p className="max-w-md text-lg text-slate-400 lg:justify-self-end">
              Answer by text or voice. Every answer is scored as soon as you finish, and your results build
              into a report you can track over time.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
            {/* Interview */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60">
              <div className="flex items-center justify-between bg-indigo-600 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">AI</span>
                  <div>
                    <div className="font-bold">AI Interviewer</div>
                    <div className="text-xs text-indigo-100">Frontend Developer · Mid level</div>
                  </div>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Question 3 of 8</span>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-700/60 px-4 py-3 text-sm leading-relaxed text-slate-100">
                  Walk me through a time you debugged a production issue under pressure.
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm leading-relaxed">
                  Our checkout API started timing out after a deploy. I rolled back, traced it to an N+1 query,
                  and added an index before re-releasing.
                </div>
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm leading-relaxed text-emerald-100">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Feedback · 86 / 100
                  </div>
                  Clear structure and good root-cause thinking. Close with one measurable result, such as response
                  time before and after the fix.
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
                <div className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-500">
                  Type your answer, or tap the mic
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
                  <Mic className="h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Report */}
            <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold">Your report</h3>
                <span className="text-xs text-slate-400">Latest session</span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-extrabold tracking-tight">8.4</span>
                <span className="pb-1.5 text-sm font-semibold text-slate-400">/ 10 overall</span>
              </div>

              <div className="mt-6 space-y-4">
                {SKILL_BARS.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-slate-300">{b.label}</span>
                      <span className="font-semibold">{b.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Resume match</span>
                  <span className="font-bold text-emerald-300">89%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  {['React', 'Node.js', 'MongoDB'].map((t) => (
                    <span key={t} className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">{t}</span>
                  ))}
                  {['Docker', 'CI/CD'].map((t) => (
                    <span key={t} className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-amber-200">{t} missing</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ How it works ----------------------------- */}
      <section id="how-it-works" className="bg-white py-24 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">From resume to ready in four steps.</h2>
            <p className="mt-4 text-lg text-slate-600">Each step feeds the next, so your practice always matches the role you want.</p>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-slate-400">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ---------------------------------- CTA ---------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700 py-24">
        <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Ready to ace your next interview?</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-indigo-100 sm:text-lg">
            Join thousands of candidates who use InterviewIQ to prepare smarter, practice harder and walk into
            interviews with confidence.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              Create your free account <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* --------------------------------- Footer -------------------------------- */}
      <footer className="bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
                <BrainCircuit className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">InterviewIQ</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              AI-powered interview preparation. Analyze your resume, practice interviews and track your progress
              toward the job you want.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {NAV_LINKS.map((l) => (
                <li key={l.target}>
                  <button type="button" onClick={() => goTo(l.target)} className="hover:text-white focus:outline-none focus-visible:text-white">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-200">Account</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>
                <button type="button" onClick={() => openAuth('login')} className="hover:text-white focus:outline-none focus-visible:text-white">
                  Sign in
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openAuth('register')} className="hover:text-white focus:outline-none focus-visible:text-white">
                  Create account
                </button>
              </li>
              <li>
                <Link to="/forgot-password" className="hover:text-white">Forgot password</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">
            © 2026 InterviewIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AuthLanding;
