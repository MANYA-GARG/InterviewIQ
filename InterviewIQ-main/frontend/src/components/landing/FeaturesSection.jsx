import {
  FileText,
  Bot,
  Camera,
  BarChart3,
  ShieldCheck,
  Mic,
} from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'Smart Resume Analyzer',
    description:
      'Upload your PDF or DOCX resume. Our AI extracts skills, scores your profile, identifies gaps, and provides targeted improvement suggestions.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    icon: Bot,
    title: 'AI Interview Simulator',
    description:
      'Practice with Groq-powered AI that generates role-specific questions based on your experience level, then scores every answer in detail.',
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    border: 'border-primary-100',
  },
  {
    icon: Camera,
    title: 'Real-Time Proctoring',
    description:
      'Webcam preview and tab-switch detection keep your sessions focused. Automated warnings enforce a real interview-like environment.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports',
    description:
      'Interactive score trend charts, category breakdowns (technical, communication, problem-solving), and role-wise interview history.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Mic,
    title: 'Voice Interview Mode',
    description:
      'Answer questions verbally. Your audio is transcribed in real time using Web Speech API with per-question countdown timers.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: ShieldCheck,
    title: 'Secure OTP Auth',
    description:
      'Email OTP verification, JWT access tokens, and refresh-token rotation guard your account and sessions end-to-end.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
  },
];

const FeaturesSection = () => (
  <section id="features" className="bg-slate-50 py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center mb-16">
        <span className="inline-block rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-700">
          Platform Features
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Everything you need to land your dream job
        </h2>
        <p className="mt-4 text-base text-slate-500">
          One platform that covers resume preparation, AI-driven interview practice, and performance analytics.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`rounded-2xl border ${f.border} bg-white p-7 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
            >
              <div className={`inline-flex rounded-xl p-3 ${f.bg}`}>
                <Icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">{f.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
