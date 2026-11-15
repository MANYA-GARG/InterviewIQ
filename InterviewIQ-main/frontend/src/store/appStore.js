import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialInterviewState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timer: 60,
  isCompleted: false,
};

export const useAppStore = create(
  persist(
    (set) => ({
      session: {
        user: null,
        token: null,
        isAuthenticated: false,
      },

      interview: { ...initialInterviewState },

      resume: {
        resumes: [],
        analysis: null,
      },

      ui: {
        loading: false,
        error: null,
      },

      setSession: ({ user, token }) =>
        set((state) => ({
          session: {
            ...state.session,
            user: user || null,
            token: token || null,
            isAuthenticated: Boolean(user || token),
          },
        })),

      clearSession: () =>
        set(() => ({
          session: {
            user: null,
            token: null,
            isAuthenticated: false,
          },
        })),

      // Clear resume-related state only (safe to call on logout)
      clearResumeState: () =>
        set(() => ({
          resume: {
            resumes: [],
            analysis: null,
          },
        })),

      // Clear entire session-related in-memory state and resume/interview buckets
      clearAllSessionData: () =>
        set(() => ({
          session: { user: null, token: null, isAuthenticated: false },
          interview: { ...initialInterviewState },
          resume: { resumes: [], analysis: null },
        })),

      setInterviewQuestions: (questions) =>
        set((state) => ({
          interview: {
            ...state.interview,
            questions: Array.isArray(questions) ? questions : [],
          },
        })),

      setCurrentQuestionIndex: (index) =>
        set((state) => ({
          interview: {
            ...state.interview,
            currentQuestionIndex: Math.max(0, Number(index) || 0),
          },
        })),

      addInterviewAnswer: (answer) =>
        set((state) => {
          const nextAnswer = answer || {};
          const answerKey = nextAnswer.questionId;
          const existingIndex = state.interview.answers.findIndex(
            (item) => item.questionId === answerKey
          );

          const answers = [...state.interview.answers];
          if (existingIndex >= 0) {
            answers[existingIndex] = {
              ...answers[existingIndex],
              ...nextAnswer,
            };
          } else {
            answers.push(nextAnswer);
          }

          return {
            interview: {
              ...state.interview,
              answers,
            },
          };
        }),

      upsertInterviewAnswer: (answer) =>
        set((state) => {
          const nextAnswer = answer || {};
          const answerKey = nextAnswer.questionId;
          const existingIndex = state.interview.answers.findIndex(
            (item) => item.questionId === answerKey
          );

          const answers = [...state.interview.answers];
          if (existingIndex >= 0) {
            answers[existingIndex] = {
              ...answers[existingIndex],
              ...nextAnswer,
            };
          } else {
            answers.push(nextAnswer);
          }

          return {
            interview: {
              ...state.interview,
              answers,
            },
          };
        }),

      setInterviewAnswers: (answers) =>
        set((state) => ({
          interview: {
            ...state.interview,
            answers: Array.isArray(answers) ? answers : [],
          },
        })),

      setInterviewTimer: (timer) =>
        set((state) => ({
          interview: {
            ...state.interview,
            timer: Number(timer) || 0,
          },
        })),

      setInterviewCompleted: (isCompleted) =>
        set((state) => ({
          interview: {
            ...state.interview,
            isCompleted: Boolean(isCompleted),
          },
        })),

      resetInterviewState: () =>
        set(() => ({
          interview: { ...initialInterviewState },
        })),

      setResumes: (resumes) =>
        set((state) => ({
          resume: {
            ...state.resume,
            resumes: Array.isArray(resumes) ? resumes : [],
          },
        })),

      setResumeAnalysis: (analysis) =>
        set((state) => ({
          resume: {
            ...state.resume,
            analysis: analysis || null,
          },
        })),

      setLoading: (loading) =>
        set((state) => ({
          ui: {
            ...state.ui,
            loading: Boolean(loading),
          },
        })),

      setError: (error) =>
        set((state) => ({
          ui: {
            ...state.ui,
            error: error || null,
          },
        })),

      clearError: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            error: null,
          },
        })),
    }),
    {
      name: 'interviewiq-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
        interview: state.interview,
        resume: state.resume,
      }),
      // Expose a helper to clear persisted storage key when needed
      // (note: Zustand persist does not expose clear API on init)
      // We'll remove the key directly from localStorage when logout occurs.
    }
  )
);
