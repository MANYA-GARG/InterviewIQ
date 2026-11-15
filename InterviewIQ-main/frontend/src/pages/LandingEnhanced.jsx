import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Camera,
  Sparkles,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Star,
  Users,
} from 'lucide-react';
import LandingNavbar from '../components/landing/LandingNavbar';
import LandingFooter from '../components/landing/LandingFooter';
import CleanContainer from '../components/CleanContainer';
import SectionWrapper from '../components/SectionWrapper';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Generated Interviews',
    text: 'Dynamic, role-specific questions generated from your profile and experience level.',
  },
  {
    icon: Camera,
    title: 'Professional Practice Mode',
    text: 'Real interview simulation with camera monitoring, timers, and focus checks.',
  },
  {
    icon: BarChart3,
    title: 'Score Analytics',
    text: 'Track performance trends, answer quality, and category-wise improvements.',
  },
  {
    icon: BrainCircuit,
    title: 'Resume Intelligence',
    text: 'Understand strengths, identify gaps, and optimize your resume for target roles.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    text: 'Protected sessions with robust auth flow and data-safe architecture.',
  },
  {
    icon: CheckCircle2,
    title: 'Actionable Feedback',
    text: 'Get practical suggestions that help you improve every interview round.',
  },
];

const trustAvatars = ['AJ', 'RM', 'KP', 'ST', 'NT', 'VK'];

const LandingEnhanced = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <LandingNavbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-indigo-800 py-24 md:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(99,102,241,0.28),transparent_45%),radial-gradient(circle_at_82%_0%,rgba(56,189,248,0.22),transparent_40%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
          <CleanContainer className="relative">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="reveal">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                  Interview Preparation,
                  <br />
                  Built for Modern Careers
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-200 max-w-xl">
                  InterviewIQ helps you move from guesswork to confidence with resume intelligence,
                  realistic mock interviews, and instant AI feedback.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-medium rounded-lg px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2 transition-all duration-300 hover:scale-105"
                  >
                    Start Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="font-medium rounded-lg px-6 py-3 border border-white/30 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  >
                    Explore Dashboard
                  </button>
                </div>
              </div>

              <div className="relative reveal">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="rounded-xl bg-slate-900/80 border border-white/10 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-200">InterviewIQ Dashboard Preview</p>
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">Live</span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-200">Score</p>
                        <p className="mt-1 text-2xl font-bold text-white">87%</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-200">Interviews</p>
                        <p className="mt-1 text-2xl font-bold text-white">24</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-gray-200">Rank</p>
                        <p className="mt-1 text-2xl font-bold text-white">Top 8%</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center justify-between text-sm text-gray-200">
                        <span>Weekly Progress</span>
                        <span>+18%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700">
                        <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="float-card absolute -left-5 top-8 hidden rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-md md:block">
                  Interview Accuracy: 92%
                </div>
                <div className="float-card-delayed absolute -right-4 bottom-8 hidden rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-md md:block">
                  Avg Improvement: +38%
                </div>
              </div>
            </div>
          </CleanContainer>
        </section>

        <section className="bg-white py-20 reveal">
          <CleanContainer>
            <div className="mb-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight text-slate-900">
                See InterviewIQ in Action
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600 max-w-3xl mx-auto">
                A clean command center designed to help you practice better and improve faster.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-gray-200">Mock Sessions</p>
                    <p className="mt-2 text-3xl font-bold text-white">120+</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-gray-200">Resume Match</p>
                    <p className="mt-2 text-3xl font-bold text-white">89%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-gray-200">Confidence Score</p>
                    <p className="mt-2 text-3xl font-bold text-white">8.4/10</p>
                  </div>
                </div>
                <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-gray-200">Performance Timeline</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-700">
                    <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400" />
                  </div>
                </div>
              </div>
            </div>
          </CleanContainer>
        </section>

        <SectionWrapper
          id="features"
          className="py-20 bg-slate-800 reveal"
          title="Everything You Need in One Interview Stack"
          subtitle="From resume analysis to final evaluation, every stage is built to be clear, measurable, and career-focused."
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-7 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.22)] transition-all duration-300"
                >
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-indigo-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-gray-200">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </SectionWrapper>

        <section className="bg-slate-100 py-16 reveal">
          <CleanContainer>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
              <div className="grid gap-8 md:grid-cols-3 md:items-center">
                <div className="md:col-span-1">
                  <h3 className="text-2xl font-bold text-slate-900">Trusted by aspiring developers</h3>
                  <p className="mt-2 text-slate-600 leading-7">Built for students and professionals preparing for high-stakes interviews.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="h-5 w-5" />
                      <span className="text-sm font-medium">Community</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">10,000+</p>
                    <p className="text-sm text-slate-600">active users</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Star className="h-5 w-5" />
                      <span className="text-sm font-medium">Average Rating</span>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-slate-900">4.8</p>
                    <p className="text-sm text-slate-600">from user feedback</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {trustAvatars.map((avatar, index) => (
                  <div
                    key={`${avatar}-${index}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    {avatar}
                  </div>
                ))}
                <span className="ml-1 text-sm text-slate-500">+ thousands more learners</span>
              </div>
            </div>
          </CleanContainer>
        </section>

        <SectionWrapper
          id="how-it-works"
          className="py-16 bg-slate-800 reveal"
          title="Simple Flow, Professional Outcome"
          subtitle="Get interview-ready with a focused process that mirrors real hiring pipelines."
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Resume', text: 'We extract skills, detect gaps, and personalize your interview context.' },
              { step: '02', title: 'Start Mock Interview', text: 'Answer timed questions with camera preview and progress tracking.' },
              { step: '03', title: 'Review Feedback', text: 'Get performance scores, strengths, and focused improvements.' },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/5 p-7 hover:scale-105 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)] transition-all duration-300"
              >
                <p className="text-indigo-300 font-semibold">Step {item.step}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 leading-7 text-gray-200">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-cyan-700 py-20 reveal">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.16),transparent_40%)]" />
          <CleanContainer className="relative">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm md:p-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white">Ready to crack your next interview?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-100">
                Start practicing with realistic AI interviews and improve your confidence before the real round.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/new-interview')}
                  className="rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-slate-100"
                >
                  Start Mock Interview
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/resumes')}
                  className="rounded-lg border border-white/60 px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-white/10"
                >
                  Upload Resume
                </button>
              </div>
            </div>
          </CleanContainer>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingEnhanced;
