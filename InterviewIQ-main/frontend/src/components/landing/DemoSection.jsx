import { BarChart3, FileText, PlayCircle, CheckCircle2, Clock, Star } from 'lucide-react';

/* A pure-CSS mock of the dashboard so no screenshots are needed */
const DemoSection = () => (
  <section id="demo" className="bg-slate-950 py-24 overflow-hidden">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center mb-14">
        <span className="inline-block rounded-full bg-primary-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary-300">
          Product Demo
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          See the platform in action
        </h2>
        <p className="mt-4 text-base text-slate-400">
          A professional AI interview workspace — question panel, webcam monitor, progress tracker, and smart controls all in one view.
        </p>
      </div>

      {/* Mock browser window */}
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-700/60 bg-slate-800 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <div className="ml-4 flex h-6 flex-1 max-w-sm items-center rounded-md bg-slate-800 px-3">
            <span className="text-xs text-slate-500">interviewiq.app/interview/session</span>
          </div>
        </div>

        {/* Dashboard layout */}
        <div className="flex min-h-[400px]">
          {/* Sidebar */}
          <div className="w-48 shrink-0 border-r border-slate-700 bg-slate-900 p-4 space-y-1">
            {[
              { label: 'Dashboard',        icon: BarChart3,   active: false },
              { label: 'Resume Analysis',  icon: FileText,    active: false },
              { label: 'AI Interview',     icon: PlayCircle,  active: true  },
              { label: 'History',          icon: Clock,       active: false },
              { label: 'Reports',          icon: BarChart3,   active: false },
            ].map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 grid grid-cols-[200px,1fr] gap-0">
            {/* Camera + progress column */}
            <div className="border-r border-slate-700 p-4 space-y-4">
              {/* Camera preview */}
              <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                  <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  {/* LIVE badge */}
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse inline-block" />
                    LIVE
                  </span>
                </div>
                <div className="px-3 py-2 bg-emerald-900/30 border-t border-emerald-800/30">
                  <p className="text-[10px] font-semibold text-emerald-400">✓ Proctoring Active</p>
                </div>
              </div>

              {/* Progress card */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Progress</p>
                <p className="text-sm font-bold text-white">Question <span className="text-primary-400">2</span> / 5</p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-2 w-2/5 rounded-full bg-gradient-to-r from-primary-500 to-indigo-400" />
                </div>
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${
                        n === 1 ? 'bg-emerald-500' : n === 2 ? 'bg-primary-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] text-slate-500">Q Timer</p>
                  <p className="text-sm font-bold text-amber-300">01:47</p>
                </div>
              </div>
            </div>

            {/* Question + answer panel */}
            <div className="p-5 flex flex-col gap-4">
              {/* Question */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">Question 2 / 5</span>
                  <span className="rounded-full bg-primary-900/40 border border-primary-700/30 px-2 py-0.5 text-[10px] font-medium text-primary-300">
                    Technical
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded bg-slate-700" />
                  <div className="h-3 w-4/5 rounded bg-slate-700" />
                  <div className="h-3 w-3/5 rounded bg-slate-700" />
                </div>
              </div>

              {/* Answer textarea */}
              <div className="rounded-xl border border-slate-600 bg-slate-900 p-3 flex-1 min-h-[100px]">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-11/12 rounded bg-slate-700" />
                  <div className="h-2.5 w-full rounded bg-slate-700" />
                  <div className="h-2.5 w-9/12 rounded bg-slate-700" />
                  <div className="h-2.5 w-4/5 rounded bg-slate-700" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">48 words — ready to submit</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 rounded-lg bg-slate-700" />
                <div className="h-8 w-20 rounded-lg bg-amber-900/40 border border-amber-700/30" />
                <div className="h-8 flex-1 rounded-lg bg-primary-600/70 flex items-center justify-center">
                  <Star className="h-3.5 w-3.5 text-white opacity-60" />
                </div>
                <div className="h-8 w-28 rounded-lg bg-red-900/40 border border-red-700/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DemoSection;
