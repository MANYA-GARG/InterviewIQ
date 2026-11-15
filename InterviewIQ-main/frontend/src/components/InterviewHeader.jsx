import { Clock3 } from 'lucide-react';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const InterviewHeader = ({
  title,
  currentQuestion,
  totalQuestions,
  questionTimeLeft,
}) => {
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;
  const questionTimeProgress = Math.max(0, Math.min(100, (questionTimeLeft / 120) * 100));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Question {currentQuestion + 1} / {totalQuestions}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-700">
          <Clock3 className="h-4 w-4" />
          <span className={`font-semibold ${questionTimeLeft <= 20 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatTime(questionTimeLeft)}
          </span>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${questionTimeLeft <= 20 ? 'bg-red-500' : 'bg-amber-500'}`}
          style={{ width: `${questionTimeProgress}%` }}
        />
      </div>
    </div>
  );
};

export default InterviewHeader;
