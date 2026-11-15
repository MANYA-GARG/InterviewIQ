import { CheckCircle2, CircleDashed, Clock3, Flag, Send, Loader2 } from 'lucide-react';

const statusMeta = {
  answered: { label: 'Answered', className: 'bg-emerald-500/20 text-emerald-200' },
  skipped: { label: 'Skipped', className: 'bg-amber-500/20 text-amber-200' },
  pending: { label: 'Pending', className: 'bg-slate-600/40 text-slate-200' },
};

const InterviewFinalReview = ({ questions, answers, skipped, marked, onEditQuestion, onSubmit, submitting }) => {
  const getStatus = (questionId) => {
    if (answers[questionId]) return 'answered';
    if (skipped.includes(questionId)) return 'skipped';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-[#030712] px-4 py-8 text-slate-100 md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-center text-3xl font-bold">Final Review</h2>
        <p className="mt-2 text-center text-sm text-slate-300">Review your responses before final submission.</p>

        <div className="mt-8 space-y-3">
          {questions.map((question, index) => {
            const status = getStatus(question._id);
            return (
              <div key={question._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <p className="text-xs text-slate-300">Question {index + 1}</p>
                    <p className="mt-1 text-sm md:text-base">{question.questionText}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {marked.includes(question._id) ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-200">
                        <Flag className="h-3.5 w-3.5" />
                        Marked
                      </span>
                    ) : null}

                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusMeta[status].className}`}>
                      {statusMeta[status].label}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEditQuestion(index)}
                      disabled={submitting}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-emerald-500/15 p-3">
            <p className="text-emerald-200">Answered</p>
            <p className="mt-1 text-2xl font-bold">{Object.keys(answers).length}</p>
          </div>
          <div className="rounded-xl bg-amber-500/15 p-3">
            <p className="text-amber-200">Skipped</p>
            <p className="mt-1 text-2xl font-bold">{skipped.length}</p>
          </div>
          <div className="rounded-xl bg-slate-600/30 p-3">
            <p className="text-slate-200">Total Questions</p>
            <p className="mt-1 text-2xl font-bold">{questions.length}</p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || Object.keys(answers).length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white hover:bg-sky-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Interview
              </>
            )}
          </button>
        </div>

        {submitting && (
          <div className="mt-6 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-center">
            <p className="text-sm text-sky-200">
              Submitting your interview and generating report. Please wait...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewFinalReview;
