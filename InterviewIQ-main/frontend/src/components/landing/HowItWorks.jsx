import { Upload, Brain, PlayCircle, TrendingUp, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    description:
      'Upload a PDF or DOCX resume. Our parser extracts text and forwards it to the skill analysis engine instantly.',
    color: 'bg-sky-600',
    textColor: 'text-sky-600',
    ringColor: 'ring-sky-100',
  },
  {
    step: '02',
    icon: Brain,
    title: 'Get AI Skill Analysis',
    description:
      'The AI identifies your detected skills, missing skills for target roles, and generates a resume score with actionable suggestions.',
    color: 'bg-primary-600',
    textColor: 'text-primary-600',
    ringColor: 'ring-primary-100',
  },
  {
    step: '03',
    icon: PlayCircle,
    title: 'Practice AI Interviews',
    description:
      'Select your job role and experience level. AI generates multi-category questions. Answer by text or voice with per-question timers.',
    color: 'bg-violet-600',
    textColor: 'text-violet-600',
    ringColor: 'ring-violet-100',
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Track Improvement',
    description:
      'View score trends, category performance breakdowns, and AI-written detailed feedback to accelerate your preparation.',
    color: 'bg-emerald-600',
    textColor: 'text-emerald-600',
    ringColor: 'ring-emerald-100',
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="bg-white py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center mb-16">
        <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          How It Works
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          From resume to offer in four steps
        </h2>
        <p className="mt-4 text-base text-slate-500">
          A streamlined workflow that takes you from raw resume to confident interview performance.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connector line (desktop) */}
        <div
          aria-hidden
          className="absolute top-10 left-0 right-0 hidden h-px bg-gradient-to-r from-sky-200 via-primary-200 to-emerald-200 lg:block"
          style={{ margin: '0 12.5%' }}
        />

        <div className="grid gap-10 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div
                  className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl ${s.color} shadow-lg text-white ring-8 ${s.ringColor}`}
                >
                  <Icon className="h-9 w-9" />
                </div>

                {/* Arrow between steps (desktop) */}
                {i < STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-5 top-7 hidden h-5 w-5 text-slate-300 lg:block"
                    aria-hidden
                  />
                )}

                <p className={`mt-6 text-xs font-bold uppercase tracking-wider ${s.textColor}`}>
                  Step {s.step}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500 max-w-xs">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
