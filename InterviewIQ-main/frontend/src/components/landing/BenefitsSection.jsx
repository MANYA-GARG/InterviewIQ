import { CheckCircle2 } from 'lucide-react';

const BENEFITS = [
  {
    heading: 'Practice Anytime, Anywhere',
    points: [
      'No scheduling required — interview on your own timeline',
      'Works on any device with a modern browser',
      'Resume your session exactly where you left off',
    ],
  },
  {
    heading: 'Targeted Preparation',
    points: [
      'Questions tailored to your exact job role & experience level',
      'Resume skill gap analysis highlights what to study',
      'Category scoring pinpoints your weakest areas',
    ],
  },
  {
    heading: 'Real Interview Conditions',
    points: [
      'Per-question countdown timers match real interview pressure',
      'Webcam proctoring keeps you accountable',
      'Tab-switch detection prevents distractions',
    ],
  },
  {
    heading: 'Track Progress Over Time',
    points: [
      'Visual score trend charts show improvement week-over-week',
      'Full interview history with detailed AI evaluation reports',
      'Role-wise comparison to identify strengths early',
    ],
  },
];

const BenefitsSection = () => (
  <section className="bg-white py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center mb-16">
        <span className="inline-block rounded-full bg-violet-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700">
          Why InterviewIQ
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Built for candidates who want to win
        </h2>
        <p className="mt-4 text-base text-slate-500">
          Every feature is designed to fill the gap between knowing your subject and performing confidently in an interview.
        </p>
      </div>

      {/* 2×2 benefit grid */}
      <div className="grid gap-8 sm:grid-cols-2">
        {BENEFITS.map((b, i) => {
          const gradients = [
            'from-primary-50 to-indigo-50 border-primary-100',
            'from-emerald-50 to-teal-50 border-emerald-100',
            'from-violet-50 to-purple-50 border-violet-100',
            'from-amber-50 to-orange-50 border-amber-100',
          ];
          return (
            <div
              key={b.heading}
              className={`rounded-2xl border bg-gradient-to-br ${gradients[i]} p-7`}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">{b.heading}</h3>
              <ul className="space-y-3">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default BenefitsSection;
