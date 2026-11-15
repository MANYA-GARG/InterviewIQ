import { useNavigate } from 'react-router-dom';
import { PlayCircle, Upload, Sparkles } from 'lucide-react';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-700 py-24">
      {/* Background decoration */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Free to Get Started
          </span>
        </div>

        <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight">
          Ready to ace your next interview?
        </h2>

        <p className="mt-5 text-base text-indigo-200 sm:text-lg max-w-xl mx-auto">
          Join thousands of candidates who use InterviewIQ to prepare smarter, practice
          harder, and walk into interviews with unshakeable confidence.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary-700 shadow-lg hover:bg-slate-100 transition-all hover:-translate-y-0.5"
          >
            <PlayCircle className="h-5 w-5" />
            Start Interview Practice
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-bold text-white hover:border-white hover:bg-white/10 transition-all"
          >
            <Upload className="h-5 w-5" />
            Analyze My Resume
          </button>
        </div>

        <p className="mt-6 text-xs text-indigo-300">
          No credit card required · Free forever plan available
        </p>
      </div>
    </section>
  );
};

export default CallToAction;
