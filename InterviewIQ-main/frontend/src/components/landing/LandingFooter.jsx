import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Github, Mail, ExternalLink } from 'lucide-react';

const LINKS = {
  Product: [
    { label: 'Features',      href: '#features' },
    { label: 'How It Works',  href: '#how-it-works' },
    { label: 'AI Interview',  href: '#demo' },
    { label: 'Resume Analyzer', href: '#features' },
  ],
  Company: [
    { label: 'About',         href: '#' },
    { label: 'Blog',          href: '#' },
    { label: 'Careers',       href: '#' },
    { label: 'Contact',       href: 'mailto:support@interviewiq.app' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy',   href: '#' },
  ],
};

const LandingFooter = () => {
  const navigate = useNavigate();

  const scrollTo = (href) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = href;
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr,1fr,1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900">
                Interview<span className="text-primary-600">IQ</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-slate-500 leading-6">
              AI-powered interview preparation platform. Analyze resumes, practice
              interviews, and track your progress to land your dream job.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@interviewiq.app"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400 transition"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-4">{group}</h4>
              <ul className="space-y-3">
                {items.map((l) => (
                  <li key={l.label}>
                    <button
                      type="button"
                      onClick={() => scrollTo(l.href)}
                      className="text-sm text-slate-500 hover:text-primary-600 transition flex items-center gap-1"
                    >
                      {l.label}
                      {l.href.startsWith('mailto:') && <ExternalLink className="h-3 w-3" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} InterviewIQ. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-slate-500 hover:text-primary-600 transition"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
