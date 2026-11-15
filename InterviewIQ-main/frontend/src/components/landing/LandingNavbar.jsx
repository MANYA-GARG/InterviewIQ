import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features',      href: '#features' },
  { label: 'How It Works',  href: '#how-it-works' },
  { label: 'Resume Analyzer', href: '#features' },
  { label: 'AI Interview',  href: '#demo' },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 shadow-sm backdrop-blur border-b border-slate-200'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Interview<span className="text-primary-600">IQ</span>
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <button
                type="button"
                onClick={() => scrollTo(l.href)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:text-primary-600 transition"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition"
          >
            Get Started Free →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-700"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <button
                  type="button"
                  onClick={() => scrollTo(l.href)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); navigate('/login'); }}
              className="rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); navigate('/register'); }}
              className="rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNavbar;
