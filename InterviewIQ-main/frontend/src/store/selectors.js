import { useAppStore } from './appStore';
import { useShallow } from 'zustand/react/shallow';

export const useSessionState = () =>
  useAppStore(useShallow((state) => ({
    session: state.session,
    setSession: state.setSession,
    clearSession: state.clearSession,
  })));

export const useInterviewState = () =>
  useAppStore(useShallow((state) => ({
    interview: state.interview,
    setInterviewQuestions: state.setInterviewQuestions,
    setCurrentQuestionIndex: state.setCurrentQuestionIndex,
    addInterviewAnswer: state.addInterviewAnswer,
    upsertInterviewAnswer: state.upsertInterviewAnswer,
    setInterviewAnswers: state.setInterviewAnswers,
    setInterviewTimer: state.setInterviewTimer,
    setInterviewCompleted: state.setInterviewCompleted,
    resetInterviewState: state.resetInterviewState,
  })));

export const useResumeState = () =>
  useAppStore(useShallow((state) => ({
    resume: state.resume,
    setResumes: state.setResumes,
    setResumeAnalysis: state.setResumeAnalysis,
  })));

export const useUIState = () =>
  useAppStore(useShallow((state) => ({
    ui: state.ui,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  })));
