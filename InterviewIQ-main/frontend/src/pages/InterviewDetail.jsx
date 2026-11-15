import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewService, evaluationService } from '../services/api';
import toast from 'react-hot-toast';
import {
  Play,
  CheckCircle,
  AlertCircle,
  Mic,
  Square,
  Volume2,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Flag,
  Upload,
  Video,
} from 'lucide-react';
import CameraPreview from '../components/CameraPreview';
import InterviewHeader from '../components/InterviewHeader';
import InterviewControls from '../components/InterviewControls';
import { useAppStore } from '../store/appStore';

const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const persistedQuestions = useAppStore((state) => state.interview.questions);
  const persistedCurrentQuestionIndex = useAppStore((state) => state.interview.currentQuestionIndex);
  const setInterviewQuestions = useAppStore((state) => state.setInterviewQuestions);
  const setGlobalCurrentQuestionIndex = useAppStore((state) => state.setCurrentQuestionIndex);
  const upsertInterviewAnswer = useAppStore((state) => state.upsertInterviewAnswer);
  const setInterviewAnswers = useAppStore((state) => state.setInterviewAnswers);
  const setInterviewTimer = useAppStore((state) => state.setInterviewTimer);
  const setInterviewCompleted = useAppStore((state) => state.setInterviewCompleted);
  const resetInterviewState = useAppStore((state) => state.resetInterviewState);
  const setGlobalLoading = useAppStore((state) => state.setLoading);
  const setGlobalError = useAppStore((state) => state.setError);
  const clearGlobalError = useAppStore((state) => state.clearError);

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState(() => persistedQuestions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    () => persistedCurrentQuestionIndex || 0
  );
  const [answerMap, setAnswerMap] = useState({});
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [inputMode, setInputMode] = useState('text');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [userConfidence, setUserConfidence] = useState(50);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(120);
  const [cameraStatus, setCameraStatus] = useState({ on: false, error: '' });
  const [skippedQuestionIds, setSkippedQuestionIds] = useState(() => new Set());
  const [markedForReviewIds, setMarkedForReviewIds] = useState(() => new Set());
  const [recordingState, setRecordingState] = useState('idle');
  const [recordingError, setRecordingError] = useState('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [recordingUploadUrl, setRecordingUploadUrl] = useState('');
  const recognitionRef = useRef(null);
  const autoNextTriggeredRef = useRef(false);
  const fetchedInterviewIdRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingBlobRef = useRef(null);
  const recorderStopResolverRef = useRef(null);
  const hasUploadedRecordingRef = useRef(false);
  const completingRef = useRef(false);
  const activityLogThrottleRef = useRef({});

  const MAX_TAB_WARNINGS = 3;

  // Constants
  const MINIMUM_WORD_COUNT = 20;
  const DEFAULT_QUESTION_TIMER_SECONDS = 120;
  const perQuestionDuration = interview?.timerDuration || DEFAULT_QUESTION_TIMER_SECONDS;
  const isVoiceMode = inputMode === 'voice';

  const normalizeResponseData = useCallback((response) => {
    if (!response || typeof response !== 'object') {
      return null;
    }
    return response.data || response;
  }, []);

  const fetchInterview = useCallback(async () => {
    setGlobalLoading(true);
    clearGlobalError();
    try {
      const response = await interviewService.getById(id);
      const payload = response.data || response;
      const sessionAnswers = Array.isArray(payload.session?.answers) ? payload.session.answers : [];
      const directAnswers = Array.isArray(payload.answers) ? payload.answers : [];
      const normalizedAnswers = sessionAnswers.length
        ? sessionAnswers
        : directAnswers.map((item) => ({
            questionId: item?.questionId || item?.question?._id || item?.question,
            answerText: item?.answerText || item?.transcript || '',
            timeTaken: item?.timeTaken || 0,
            mode: item?.mode || 'text',
          }));

      const nextAnswerMap = normalizedAnswers.reduce((accumulator, item) => {
        if (item?.questionId) {
          accumulator[item.questionId] = item;
        }
        return accumulator;
      }, {});

      setInterview(payload.interview);
      setQuestions(payload.questions || []);
      setInterviewQuestions(payload.questions || []);
      setInterviewAnswers(normalizedAnswers);
      setAnswerMap(nextAnswerMap);
      const initialTimer = payload.interview?.timerDuration || DEFAULT_QUESTION_TIMER_SECONDS;
      setQuestionTimeLeft(initialTimer);
      setInterviewTimer(initialTimer);
      setSkippedQuestionIds(new Set());
      setMarkedForReviewIds(new Set());
      if (payload.session?.currentQuestionIndex !== undefined) {
        setCurrentQuestionIndex(payload.session.currentQuestionIndex);
        setGlobalCurrentQuestionIndex(payload.session.currentQuestionIndex);
      }
    } catch (error) {
      setGlobalError(error.response?.data?.message || 'Failed to load interview');
      toast.error('Failed to load interview');
      navigate('/dashboard');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }, [
    clearGlobalError,
    id,
    navigate,
    setGlobalCurrentQuestionIndex,
    setGlobalError,
    setGlobalLoading,
    setInterviewAnswers,
    setInterviewQuestions,
    setInterviewTimer,
  ]);

  useEffect(() => {
    if (!id || fetchedInterviewIdRef.current === id) {
      return;
    }

    fetchedInterviewIdRef.current = id;
    fetchInterview();
  }, [id, fetchInterview]);

  const handleStartInterview = async () => {
    navigate(`/interview/live?id=${id}`);
  };

  // Helper functions
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getConfidenceLevel = (score) => {
    if (score >= 80) return 'Very Confident';
    if (score >= 60) return 'Confident';
    if (score >= 40) return 'Somewhat Confident';
    return 'Not Confident';
  };

  const upsertLocalAnswer = useCallback((questionId, data) => {
    if (!questionId) {
      return;
    }

    setAnswerMap((previous) => ({
      ...previous,
      [questionId]: {
        ...(previous[questionId] || {}),
        ...data,
      },
    }));
  }, []);

  const getStoredAnswerByQuestionId = useCallback(
    (questionId) => {
      if (!questionId) {
        return null;
      }

      return answerMap[questionId] || null;
    },
    [answerMap]
  );

  const persistCurrentAnswerDraft = useCallback(
    (nextAnswerText, nextConfidence = userConfidence, nextMode = inputMode) => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion?._id) {
        return;
      }

      upsertInterviewAnswer({
        questionId: currentQuestion._id,
        answerText: nextAnswerText,
        confidence: nextConfidence,
        mode: nextMode,
        isDraft: true,
      });
      upsertLocalAnswer(currentQuestion._id, {
        questionId: currentQuestion._id,
        answerText: nextAnswerText,
        confidence: nextConfidence,
        mode: nextMode,
        isDraft: true,
      });
    },
    [currentQuestionIndex, questions, upsertInterviewAnswer, upsertLocalAnswer, userConfidence, inputMode]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, [isListening]);

  const handleUserStartSpeaking = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported) {
      toast.error('Speech-to-text is not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech-to-text is not supported in this browser');
      return;
    }

    handleUserStartSpeaking();

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcriptPart = event.results[index][0]?.transcript || '';
          if (event.results[index].isFinal) {
            finalChunk += ` ${transcriptPart}`;
          } else {
            interimChunk += ` ${transcriptPart}`;
          }
        }

        const cleanedInterim = interimChunk.trim();
        setInterimTranscript(cleanedInterim);

        if (finalChunk.trim()) {
          setAnswer((previousAnswer) => {
            const nextAnswer = `${previousAnswer} ${finalChunk}`.replace(/\s+/g, ' ').trim();
            persistCurrentAnswerDraft(nextAnswer, userConfidence, 'voice');
            // Notify user that transcript piece was captured
            try {
              toast.success('Transcript captured');
            } catch (e) {}
            return nextAnswer;
          });
        }
      };

      recognition.onerror = (event) => {
        const message =
          event.error === 'not-allowed'
            ? 'Microphone permission denied for speech recognition.'
            : event.error === 'audio-capture'
            ? 'No microphone detected for speech recognition.'
            : event.error === 'network'
            ? 'Speech recognition network error. Please try again.'
            : 'Speech recognition stopped unexpectedly.';
        setSpeechError(message);
        // Provide clear recovery message for users
        setTimeout(() => {
          // set a visible guidance message on UI
          setSpeechError((prev) => `${prev} — continue typing manually`);
        }, 200);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    try {
      setSpeechError('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      setSpeechError('Unable to start speech recognition. Please try again.');
      setIsListening(false);
    }
  }, [handleUserStartSpeaking, persistCurrentAnswerDraft, speechSupported, userConfidence]);

  const handleInputModeChange = (mode) => {
    if (mode === inputMode) {
      return;
    }

    if (isListening) {
      stopListening();
    }

    setInputMode(mode);
    setInterimTranscript('');
    setSpeechError('');
    persistCurrentAnswerDraft(answer, userConfidence, mode);
  };

  const speakQuestion = useCallback((text, { force = false } = {}) => {
    if (!window.speechSynthesis) {
      toast.error('Text-to-speech is not supported in this browser');
      return;
    }

    if (!text) {
      return;
    }

    if (!force && hasSpoken) {
      return;
    }

    if (window.speechSynthesis.speaking) {
      if (force) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    if (!force) {
      setHasSpoken(true);
    }
    window.speechSynthesis.speak(utterance);
  }, [hasSpoken]);

  const goToQuestion = useCallback(
    (targetIndex) => {
      if (isListening) {
        stopListening();
      }
      const boundedIndex = Math.max(0, Math.min(targetIndex, questions.length - 1));
      setHasSpoken(false);
      setCurrentQuestionIndex(boundedIndex);
      setGlobalCurrentQuestionIndex(boundedIndex);
      setInterimTranscript('');
    },
    [questions.length, setGlobalCurrentQuestionIndex, isListening, stopListening]
  );

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      persistCurrentAnswerDraft(answer, userConfidence, inputMode);
      goToQuestion(currentQuestionIndex - 1);
    }
  }, [answer, currentQuestionIndex, goToQuestion, inputMode, persistCurrentAnswerDraft, userConfidence]);

  const handleSubmitAnswer = async () => {
    const final = (answer || interimTranscript || '').toString().trim();
    if (!final) {
      toast.error('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      const activeQuestion = questions[currentQuestionIndex];
      const payload = {
        questionId: activeQuestion._id,
        answerText: final,
        transcript: interimTranscript?.trim?.() || undefined,
      };
      await interviewService.submitAnswer(payload);

      upsertInterviewAnswer({
        questionId: activeQuestion._id,
        answerText: final,
        mode: inputMode,
        confidence: userConfidence,
        isDraft: false,
        submitted: true,
        timeTaken: perQuestionDuration - questionTimeLeft,
      });
      upsertLocalAnswer(activeQuestion._id, {
        questionId: activeQuestion._id,
        answerText: final,
        mode: inputMode,
        confidence: userConfidence,
        isDraft: false,
        submitted: true,
        timeTaken: perQuestionDuration - questionTimeLeft,
      });
      
      toast.success('Answer submitted');
      setSkippedQuestionIds((previous) => {
        if (!previous.has(activeQuestion._id)) {
          return previous;
        }
        const next = new Set(previous);
        next.delete(activeQuestion._id);
        return next;
      });

      if (currentQuestionIndex < questions.length - 1) {
        goToQuestion(currentQuestionIndex + 1);
      } else {
        await handleCompleteInterview();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = useCallback(() => {
    toast('Question skipped');
    const activeQuestion = questions[currentQuestionIndex];
    if (activeQuestion?._id && !answer.trim()) {
      setSkippedQuestionIds((previous) => {
        if (previous.has(activeQuestion._id)) {
          return previous;
        }
        const next = new Set(previous);
        next.add(activeQuestion._id);
        return next;
      });
    }

    if (currentQuestionIndex < questions.length - 1) {
      persistCurrentAnswerDraft(answer, userConfidence, inputMode);
      goToQuestion(currentQuestionIndex + 1);
    } else {
      handleCompleteInterview();
    }
  }, [
    answer,
    currentQuestionIndex,
    goToQuestion,
    inputMode,
    persistCurrentAnswerDraft,
    questions.length,
    questions,
    userConfidence,
  ]);

  const handleEndInterview = () => {
    persistCurrentAnswerDraft(answer, userConfidence, inputMode);
    handleCompleteInterview();
  };

  const sendSuspiciousActivity = useCallback(async (type, message, metadata = {}) => {
    if (!id || interview?.status !== 'in-progress') {
      return;
    }

    const key = `${type}:${message}`;
    const now = Date.now();
    const previousAt = activityLogThrottleRef.current[key] || 0;
    if (now - previousAt < 3000) {
      return;
    }

    activityLogThrottleRef.current[key] = now;

    try {
      await interviewService.logActivity(id, {
        type,
        message,
        metadata,
        occurredAt: new Date().toISOString(),
      });
    } catch (_error) {
      // Non-blocking best effort logging.
    }
  }, [id, interview?.status]);

  const handleTabWarning = useCallback((message, type = 'tab-hidden') => {
    setTabWarnings((prev) => {
      if (prev >= MAX_TAB_WARNINGS) {
        return prev;
      }

      const newCount = prev + 1;
      if (newCount === 1) {
        toast.error('Please stay on tab');
      }
      sendSuspiciousActivity(type, message, { warningCount: newCount });
      if (newCount >= MAX_TAB_WARNINGS) {
        toast.error('Maximum violations reached. Interview is being ended.');
        handleCompleteInterview();
      }
      return newCount;
    });
  }, [sendSuspiciousActivity]);

  const getPreferredRecordingMimeType = useCallback(() => {
    if (!window.MediaRecorder) {
      return null;
    }
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  }, []);

  const startRecording = useCallback(() => {
    if (recordingState === 'recording' || recordingState === 'uploading') {
      return;
    }

    if (!window.MediaRecorder) {
      setRecordingError('MediaRecorder is not supported in this browser.');
      setRecordingState('error');
      return;
    }

    const stream = mediaStreamRef.current;
    if (!stream) {
      return;
    }

    try {
      recordingChunksRef.current = [];
      const mimeType = getPreferredRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || 'video/webm';
        const blob = new Blob(recordingChunksRef.current, { type: blobType });
        recordingBlobRef.current = blob;
        const previewUrl = URL.createObjectURL(blob);
        setRecordedVideoUrl((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return previewUrl;
        });
        setRecordingState('ready');
        if (recorderStopResolverRef.current) {
          recorderStopResolverRef.current(blob);
          recorderStopResolverRef.current = null;
        }
      };

      recorder.onerror = () => {
        setRecordingError('Recording failed. Please verify camera and microphone access.');
        setRecordingState('error');
        if (recorderStopResolverRef.current) {
          recorderStopResolverRef.current(recordingBlobRef.current || null);
          recorderStopResolverRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      setRecordingError('');
      setRecordingState('recording');
      recorder.start(1000);
    } catch (_error) {
      setRecordingError('Unable to start recording. Please check browser permissions.');
      setRecordingState('error');
    }
  }, [getPreferredRecordingMimeType, recordingState]);

  const stopRecorderAndGetBlob = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return recordingBlobRef.current;
    }

    if (recorder.state === 'inactive') {
      return recordingBlobRef.current;
    }

    setRecordingState('stopping');
    return new Promise((resolve) => {
      recorderStopResolverRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const uploadRecordingBlob = useCallback(async (blob) => {
    if (!blob || hasUploadedRecordingRef.current || !id) {
      return;
    }

    const formData = new FormData();
    formData.append('interviewId', id);
    formData.append('recording', blob, `interview-${id}-${Date.now()}.webm`);

    setRecordingState('uploading');
    const response = await interviewService.saveRecording(formData);
    const payload = normalizeResponseData(response);
    const recording = payload?.recording || payload?.data?.recording;
    if (recording?.mediaUrl) {
      setRecordingUploadUrl(recording.mediaUrl);
    }
    hasUploadedRecordingRef.current = true;
    setRecordingState('uploaded');
  }, [id, normalizeResponseData]);

  const stopAndUploadRecording = useCallback(async () => {
    if (hasUploadedRecordingRef.current) {
      return;
    }

    const blob = await stopRecorderAndGetBlob();
    if (!blob) {
      return;
    }

    try {
      await uploadRecordingBlob(blob);
    } catch (_error) {
      setRecordingState('error');
      setRecordingError('Recording was captured but upload failed. You can retry before final submit.');
    }
  }, [stopRecorderAndGetBlob, uploadRecordingBlob]);

  const buildCompletionAnswers = useCallback(() => {
    return questions
      .map((question) => {
        const stored = getStoredAnswerByQuestionId(question?._id);
        const answerText = stored?.answerText?.trim?.() || '';
        if (!question?._id || !answerText) {
          return null;
        }

        return {
          questionId: question._id,
          answerText,
          timeTaken: Number(stored?.timeTaken) || 0,
          mode: stored?.mode || inputMode,
          confidence: Number.isFinite(stored?.confidence) ? stored.confidence : 50,
        };
      })
      .filter(Boolean);
  }, [questions, getStoredAnswerByQuestionId, inputMode]);

  const handleCompleteInterview = async () => {
    if (completingRef.current) {
      return;
    }

    completingRef.current = true;
    try {
      await stopAndUploadRecording();
      const completionAnswers = buildCompletionAnswers();

      await interviewService.complete(id, {
        answers: completionAnswers,
        skipped: Array.from(skippedQuestionIds),
        markedForReview: Array.from(markedForReviewIds),
      });

      setInterviewCompleted(true);
      toast.success('Interview completed!');
      fetchInterview();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete interview');
    } finally {
      completingRef.current = false;
    }
  };

  const handleToggleMarkForReview = useCallback(() => {
    const activeQuestion = questions[currentQuestionIndex];
    if (!activeQuestion?._id) {
      return;
    }

    setMarkedForReviewIds((previous) => {
      const next = new Set(previous);
      if (next.has(activeQuestion._id)) {
        next.delete(activeQuestion._id);
        toast('Removed from review list');
      } else {
        next.add(activeQuestion._id);
        toast.success('Marked for final review');
      }
      return next;
    });
  }, [currentQuestionIndex, questions]);

  const unansweredCount = useMemo(
    () =>
      questions.reduce((count, question) => {
        const answerText = getStoredAnswerByQuestionId(question?._id)?.answerText?.trim?.() || '';
        return answerText ? count : count + 1;
      }, 0),
    [questions, getStoredAnswerByQuestionId]
  );

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await evaluationService.evaluate(id);
      toast.success('Evaluation completed!');
      navigate(`/evaluation/${id}`);
    } catch (error) {
      toast.error('Failed to evaluate interview');
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(supported);
  }, []);

  useEffect(() => {
    if (!interview) {
      return;
    }

    if (interview.mode === 'voice') {
      setInputMode('voice');
    }
  }, [interview]);

  useEffect(() => {
    const current = questions[currentQuestionIndex];
    if (current && isVoiceMode && !hasSpoken) {
      speakQuestion(current.questionText);
    }
  }, [currentQuestionIndex, questions, isVoiceMode, hasSpoken, speakQuestion]);

  useEffect(() => {
    const activeQuestion = questions[currentQuestionIndex];
    if (!activeQuestion?._id) {
      setAnswer((previous) => (previous === '' ? previous : ''));
      setUserConfidence((previous) => (previous === 50 ? previous : 50));
      return;
    }

    const stored = getStoredAnswerByQuestionId(activeQuestion._id);
    const nextAnswer = stored?.answerText || '';
    const nextMode = stored?.mode || (interview?.mode === 'voice' ? 'voice' : 'text');
    const nextConfidence = Number.isFinite(stored?.confidence) ? stored.confidence : 50;

    setAnswer((previous) => (previous === nextAnswer ? previous : nextAnswer));
    setInputMode((previous) => (previous === nextMode ? previous : nextMode));
    setUserConfidence((previous) => (previous === nextConfidence ? previous : nextConfidence));
    setInterimTranscript('');
  }, [currentQuestionIndex, questions, getStoredAnswerByQuestionId, interview?.mode]);

  // Per-question countdown for text mode
  useEffect(() => {
    if (!interview) return;
    autoNextTriggeredRef.current = false;
    setQuestionTimeLeft(perQuestionDuration);
    setInterviewTimer(perQuestionDuration);
    const timerId = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          setInterviewTimer(0);
          return 0;
        }
        const next = prev - 1;
        setInterviewTimer(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [currentQuestionIndex, interview, perQuestionDuration, setInterviewTimer]);

  useEffect(() => {
    if (
      interview?.status !== 'in-progress' ||
      questionTimeLeft > 0 ||
      submitting ||
      autoNextTriggeredRef.current
    ) {
      return;
    }

    autoNextTriggeredRef.current = true;
    toast('Time is up, moving to next question');
    handleSkip();
  }, [questionTimeLeft, interview, submitting, handleSkip]);

  useEffect(() => {
    if (interview?.status !== 'in-progress') {
      return;
    }

    if (cameraStatus.on && mediaStreamRef.current) {
      startRecording();
    }
  }, [cameraStatus.on, interview?.status, startRecording]);

  useEffect(() => {
    if (interview?.status !== 'in-progress') {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleTabWarning('Tab switch detected! Please stay on this page.', 'tab-hidden');
      }
    };

    const handleWindowBlur = () => {
      handleTabWarning('Window focus lost. Please stay on the interview tab.', 'window-blur');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [interview?.status, handleTabWarning]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [recordedVideoUrl]);

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex],
    [questions, currentQuestionIndex]
  );
  const canSubmitCurrentAnswer =
    inputMode === 'voice'
      ? Boolean(answer.trim())
      : Boolean(answer.trim()) && getWordCount(answer) >= MINIMUM_WORD_COUNT;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="card text-center py-10 text-slate-600">
        Interview data unavailable.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        {interview.status === 'in-progress' && currentQuestion && (
          <InterviewHeader
            title={interview.jobRole}
            currentQuestion={currentQuestionIndex}
            totalQuestions={questions.length}
            questionTimeLeft={questionTimeLeft}
          />
        )}

        {/* Pending State */}
        {interview.status === 'pending' && (
          <div className="card text-center py-12">
            <AlertCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              Click below to begin your mock interview
            </p>
            <button onClick={handleStartInterview} className="btn-primary inline-flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Start Interview
            </button>
          </div>
        )}

        {/* In Progress State */}
        {interview.status === 'in-progress' && currentQuestion && (
          <div className="space-y-6">
            <div className="fixed right-4 top-20 z-40 w-44 md:w-52">
              <CameraPreview
                active={interview.status === 'in-progress'}
                onStatusChange={setCameraStatus}
                onStreamChange={(stream) => {
                  mediaStreamRef.current = stream;
                }}
              />
              <div className="mt-2 space-y-2">
                <div className={`rounded-lg px-2.5 py-2 text-xs ${cameraStatus.on ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {cameraStatus.on ? 'Camera active' : (cameraStatus.error || 'Starting camera...')}
                </div>
                <div className={`rounded-lg px-2.5 py-2 text-xs ${recordingState === 'recording' || recordingState === 'uploaded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : recordingState === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                  <div className="inline-flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> Recording: {recordingState}
                  </div>
                  {recordingError && <p className="mt-1">{recordingError}</p>}
                  {recordingState === 'error' && recordingBlobRef.current && (
                    <button
                      type="button"
                      onClick={() => uploadRecordingBlob(recordingBlobRef.current)}
                      className="mt-2 inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <Upload className="h-3 w-3" /> Retry
                    </button>
                  )}
                </div>
                <div className={`rounded-lg px-2.5 py-2 text-xs border ${tabWarnings === 0 ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  Warnings: {tabWarnings}/{MAX_TAB_WARNINGS}
                </div>
              </div>
            </div>

            <div className="pr-0 md:pr-60">
              <div key={currentQuestion._id} className="card transition-all duration-300 animate-question-fade">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize">
                  {currentQuestion.category}
                </span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.questionText}
              </h2>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleToggleMarkForReview}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                    markedForReviewIds.has(currentQuestion._id)
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  {markedForReviewIds.has(currentQuestion._id) ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-2 inline-flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputModeChange('text')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    !isVoiceMode
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Text Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleInputModeChange('voice')}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isVoiceMode
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Voice Mode
                </button>
              </div>

              {isVoiceMode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-600">Question Timer</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {questionTimeLeft}s
                      </p>
                    </div>
                    <button
                      onClick={() => speakQuestion(currentQuestion.questionText, { force: true })}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Volume2 className="h-5 w-5 mr-2" />
                      {isSpeaking ? 'Stop' : 'Replay'} Question
                    </button>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {!isListening ? (
                        <button
                          type="button"
                          onClick={startListening}
                          disabled={submitting || !speechSupported}
                          className="btn-primary inline-flex items-center"
                        >
                          <Mic className="h-5 w-5 mr-2" />
                          Start Voice Input
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopListening}
                          className="btn-secondary inline-flex items-center"
                        >
                          <Square className="h-5 w-5 mr-2" />
                          Stop Voice Input
                        </button>
                      )}
                      <span className={`text-sm font-medium ${isListening ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {isListening ? 'Listening...' : 'Idle'}
                      </span>
                    </div>

                    {interimTranscript && (
                      <p className="text-sm text-slate-500 italic">
                        Live transcript: {interimTranscript}
                      </p>
                    )}

                    {speechError && (
                      <p className="text-sm text-red-600">{speechError}</p>
                    )}

                    {!speechSupported && (
                      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                        Speech-to-text is not supported in this browser. Switch to Text Mode to continue.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transcribed Answer
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => {
                        const nextAnswer = e.target.value;
                        setAnswer(nextAnswer);
                        persistCurrentAnswerDraft(nextAnswer, userConfidence, 'voice');
                      }}
                      className="input-field min-h-[180px]"
                      placeholder="Your speech will appear here. You can also edit text manually."
                      disabled={submitting}
                    />
                  </div>

                  <InterviewControls
                    onPrevious={handlePrevious}
                    onNext={handleSubmitAnswer}
                    onSkip={handleSkip}
                    onEnd={handleEndInterview}
                    disablePrevious={submitting || currentQuestionIndex === 0}
                    disableNext={submitting || !canSubmitCurrentAnswer}
                    disableEnd={submitting}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Answer
                      </label>
                      <textarea
                        value={answer}
                        onChange={(e) => {
                          const nextAnswer = e.target.value;
                          setAnswer(nextAnswer);
                            persistCurrentAnswerDraft(nextAnswer, userConfidence, 'text');
                        }}
                        className="input-field min-h-[200px]"
                        placeholder="Type your answer here..."
                        disabled={submitting}
                      />
                      
                      {/* Word Count Display */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-gray-500" />
                          <span className={`text-sm font-medium ${
                            getWordCount(answer) >= MINIMUM_WORD_COUNT
                              ? 'text-green-600'
                              : 'text-orange-600'
                          }`}>
                            {getWordCount(answer)} words
                          </span>
                          <span className="text-sm text-gray-500">
                            (Min: {MINIMUM_WORD_COUNT})
                          </span>
                        </div>
                        {getWordCount(answer) < MINIMUM_WORD_COUNT && (
                          <div className="flex items-center space-x-1 text-orange-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Add {MINIMUM_WORD_COUNT - getWordCount(answer)} more words</span>
                          </div>
                        )}
                        {getWordCount(answer) >= MINIMUM_WORD_COUNT && (
                          <div className="flex items-center space-x-1 text-green-600 text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Ready to submit</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confidence Slider */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        How confident are you about this answer?
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={userConfidence}
                          onChange={(e) => {
                            const nextConfidence = parseInt(e.target.value, 10);
                            setUserConfidence(nextConfidence);
                            persistCurrentAnswerDraft(answer, nextConfidence, inputMode);
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={submitting}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Not Confident</span>
                          <span className="text-sm font-semibold text-primary-600">
                            {getConfidenceLevel(userConfidence)} ({userConfidence}%)
                          </span>
                          <span className="text-sm text-gray-600">Very Confident</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <InterviewControls
                    onPrevious={handlePrevious}
                    onNext={handleSubmitAnswer}
                    onSkip={handleSkip}
                    onEnd={handleEndInterview}
                    disablePrevious={submitting || currentQuestionIndex === 0}
                    disableNext={submitting || !canSubmitCurrentAnswer}
                    disableEnd={submitting}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                  />
                </>
              )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">{isVoiceMode ? 'Time Left' : 'Q Timer'}</p>
                    <p className={`text-xl font-bold ${
                      questionTimeLeft < 30 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {questionTimeLeft}s
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-primary-500" />
                </div>
              </div>

              {!isVoiceMode && (
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">Words</p>
                      <p className={`text-xl font-bold ${
                        getWordCount(answer) >= MINIMUM_WORD_COUNT ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {getWordCount(answer)}
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
              )}

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Review Flags</p>
                    <p className="text-xl font-bold text-primary-600">{markedForReviewIds.size}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Flag className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Completed State */}
        {interview.status === 'completed' && (
          <div className="card text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Interview Completed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your interview has been successfully completed. View your detailed evaluation and feedback.
            </p>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="btn-primary inline-flex items-center gap-2"
            >
              {evaluating && (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {evaluating ? 'Evaluating…' : 'Get AI Evaluation & Report'}
            </button>

            {(recordingUploadUrl || recordedVideoUrl) && (
              <div className="mt-8 text-left">
                <h3 className="text-base font-semibold text-slate-900 mb-2">Interview Recording</h3>
                <video
                  controls
                  className="w-full rounded-xl border border-slate-200 bg-black"
                  src={recordingUploadUrl || recordedVideoUrl}
                />
              </div>
            )}

            <div className="mt-8 text-left border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Final Review</h3>
              <p className="text-sm text-slate-600 mb-4">
                Answered: {questions.length - unansweredCount}/{questions.length} | Skipped: {skippedQuestionIds.size} | Marked: {markedForReviewIds.size}
              </p>
              <div className="grid gap-2">
                {questions.map((question, index) => {
                  const questionId = question._id;
                  const answerText = getStoredAnswerByQuestionId(questionId)?.answerText?.trim?.() || '';
                  const isAnswered = Boolean(answerText);
                  const isSkipped = skippedQuestionIds.has(questionId);
                  const isMarked = markedForReviewIds.has(questionId);

                  return (
                    <div
                      key={questionId}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        isAnswered
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : isSkipped
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      <span className="font-medium">Q{index + 1}.</span> {question.questionText}
                      <span className="ml-2 text-xs font-semibold">
                        {isAnswered ? 'ANSWERED' : isSkipped ? 'SKIPPED' : 'PENDING'}
                        {isMarked ? ' | MARKED' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Evaluated State */}
        {interview.status === 'evaluated' && (
          <div className="card text-center py-12">
            <CheckCircle className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Evaluation Complete!
            </h2>
            <p className="text-gray-600 mb-6">View your detailed evaluation and feedback</p>
            <button
              onClick={() => navigate(`/evaluation/${id}`)}
              className="btn-primary"
            >
              View Evaluation
            </button>
          </div>
        )}
      </div>
  );
};

export default InterviewDetail;
