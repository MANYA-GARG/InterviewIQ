import { ChevronLeft, ChevronRight, SkipForward, XCircle } from 'lucide-react';

const InterviewControls = ({
  onPrevious,
  onNext,
  onSkip,
  onEnd,
  disablePrevious,
  disableNext,
  disableEnd,
  isLastQuestion,
}) => {
  const handleEnd = () => {
    if (window.confirm('End this interview now?')) {
      onEnd();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disablePrevious || !onPrevious}
          className="font-medium rounded-lg px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </span>
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={false}
          className="font-medium rounded-lg px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <SkipForward className="h-4 w-4" />
            Skip
          </span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          className="font-medium rounded-lg px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            {isLastQuestion ? 'Finish' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
        <button
          type="button"
          onClick={handleEnd}
          disabled={disableEnd}
          className="font-medium rounded-lg px-6 py-3 border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            End Interview
          </span>
        </button>
      </div>
    </div>
  );
};

export default InterviewControls;
