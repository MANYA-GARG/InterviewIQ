import { TrendingUp, Brain, Zap, Users } from 'lucide-react';

const STATS = [
  {
    value: '10,000+',
    label: 'Interviews Practiced',
    icon: TrendingUp,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  {
    value: 'AI Resume',
    label: 'Skill Analyzer',
    icon: Brain,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    value: 'Real-Time',
    label: 'Interview Feedback',
    icon: Zap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: '95%',
    label: 'Candidate Satisfaction',
    icon: Users,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

const StatsSection = () => (
  <section className="bg-white py-14 border-b border-slate-100">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm hover:shadow-md transition"
            >
              <div className={`inline-flex rounded-xl p-3 ${s.bg}`}>
                <Icon className={`h-6 w-6 ${s.color}`} />
              </div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default StatsSection;
