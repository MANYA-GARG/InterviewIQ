import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { interviewService } from '../services/api';
import InterviewJoinScreen from '../components/interview/InterviewJoinScreen';
import InterviewLiveStage from '../components/interview/InterviewLiveStage';
import InterviewFinalReview from '../components/interview/InterviewFinalReview';

const VOICE_STATES = Object.freeze({
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
});

const INTERVIEW_PHASES = Object.freeze({
  SETUP: 'SETUP',
  STARTED: 'STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

const Interview = () => {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const id = routeId || searchParams.get('id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [skipped, setSkipped] = useState([]);
  const [marked, setMarked] = useState([]);

  const [interviewPhase, setInterviewPhase] = useState(INTERVIEW_PHASES.SETUP);
  const [answerMode, setAnswerMode] = useState('text');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [status, setStatus] = useState('waiting');
  const [hasSpoken, setHasSpoken] = useState(false);

  const [stream, setStream] = useState(null);
  const mediaStreamRef = useRef(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceState, setVoiceState] = useState(VOICE_STATES.IDLE);

  const voiceStateRef = useRef(VOICE_STATES.IDLE);
  const isListeningRef = useRef(false);
  const isMicOnRef = useRef(true);
  const interviewPhaseRef = useRef(INTERVIEW_PHASES.SETUP);
  const answerModeRef = useRef('text');
  const shouldResumeListeningRef = useRef(false);

  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const lastWarningTimeRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [recordingStatus, setRecordingStatus] = useState('idle');

  // timerDuration from the backend is seconds PER QUESTION (60-180)
  const questionDuration = interview?.timerDuration || 120;

  const speechSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(seconds, 0) / 60);
    const secs = Math.max(seconds, 0) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQuestion =
    interviewPhase === INTERVIEW_PHASES.IN_PROGRESS ? questions[currentIndex] : null;

  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);
  useEffect(() => { interviewPhaseRef.current = interviewPhase; }, [interviewPhase]);
  useEffect(() => { answerModeRef.current = answerMode; }, [answerMode]);

  const enterFullscreen = async () => {
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
      try {
        await element.requestFullscreen();
      } catch {
        // Ignore fullscreen request failure on unsupported environments.
      }
    }
  };

  const handleFullscreen = async () => {
    const elem = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) await elem.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Browser-specific fullscreen restrictions can fail silently.
    }
  };

  const stopSpeechRecognition = useCallback(({ clearTranscript = true } = {}) => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
    if (clearTranscript) {
      setLiveTranscript('');
    }
    if (voiceStateRef.current !== VOICE_STATES.SPEAKING) {
      setVoiceState(VOICE_STATES.IDLE);
    }
  }, []);

  const startSpeechRecognition = useCallback((fromAutoResume = false) => {
    if (!speechSupported) {
      toast.error('Speech-to-text is not supported in this browser.');
      return;
    }
    if (!isMicOnRef.current) {
      toast.error('Turn microphone on before starting voice mode.');
      return;
    }
    if (voiceStateRef.current === VOICE_STATES.SPEAKING) return;
    if (interviewPhaseRef.current !== INTERVIEW_PHASES.IN_PROGRESS) return;
    if (fromAutoResume && answerModeRef.current !== 'voice') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      // Ignore captured audio during TTS to prevent feedback loop.
      if (voiceStateRef.current === VOICE_STATES.SPEAKING) return;

      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += `${transcript} `;
        } else {
          interim += transcript;
        }
      }

      if (finalText) {
        setCurrentAnswer((prev) => `${prev}${finalText}`.trimStart());
        setVoiceState(VOICE_STATES.LISTENING);
      }
      setLiveTranscript(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscript('');
      if (voiceStateRef.current !== VOICE_STATES.SPEAKING) {
        setVoiceState(VOICE_STATES.IDLE);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript('');
      if (voiceStateRef.current !== VOICE_STATES.SPEAKING) {
        setVoiceState(VOICE_STATES.IDLE);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setStatus('listening');
      setVoiceState(VOICE_STATES.LISTENING);
    } catch (error) {
      console.error('[speech] could not start recognition:', error?.message);
    }
  }, [speechSupported]);

  const speak = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return;
    stopSpeechRecognition({ clearTranscript: false });
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.onstart = () => {
      setStatus('asking');
      setVoiceState(VOICE_STATES.SPEAKING);
    };
    utterance.onend = () => {
      setStatus('listening');
      setVoiceState(VOICE_STATES.IDLE);
      if (shouldResumeListeningRef.current) {
        setTimeout(() => startSpeechRecognition(true), 200);
      }
    };
    utterance.onerror = () => {
      setStatus('listening');
      setVoiceState(VOICE_STATES.IDLE);
    };
    window.speechSynthesis.speak(utterance);
  }, [startSpeechRecognition, stopSpeechRecognition]);

  const handleUserStartSpeaking = useCallback(() => {
    shouldResumeListeningRef.current = false;
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Load interview
  useEffect(() => {
    if (!id) {
      setLoading(false);
      toast.error('Interview id is missing.');
      navigate('/dashboard');
      return;
    }

    const fetchInterview = async () => {
      try {
        const response = await interviewService.getById(id);
        const loadedInterview = response.data.interview;
        const loadedQuestions = response.data.questions || [];

        setInterview(loadedInterview);
        setQuestions(loadedQuestions);

        const answersMap = {};
        (response.data.answers || []).forEach((item) => {
          if (item.status !== 'skipped' && item.answerText) {
            answersMap[item.question] = item.answerText;
          }
        });
        setAnswers(answersMap);

        if (loadedInterview?.status === 'completed') {
          setInterviewPhase(INTERVIEW_PHASES.COMPLETED);
          setStatus('completed');
        }
      } catch (error) {
        toast.error('Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  // Reset per-question state when the question changes
  useEffect(() => {
    if (!currentQuestion) return;
    setCurrentAnswer(answers[currentQuestion._id] || '');
    setQuestionTimeLeft(questionDuration);
    setQuestionElapsed(0);
    setLiveTranscript('');
    setStatus('waiting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQuestion?._id, questionDuration]);

  // Read each new question aloud once
  useEffect(() => {
    if (!currentQuestion?.questionText) return;
    if (!hasSpoken) {
      speak(currentQuestion.questionText);
      setHasSpoken(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop?.();
    };
  }, []);

  // Camera + mic
  useEffect(() => {
    let active = true;

    const startMedia = async () => {
      setCameraLoading(true);
      setPermissionError('');
      try {
        const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        mediaStreamRef.current = media;
        setStream(media);
        setCameraStatus('active');
        setRecordingStatus('recording');
      } catch (error) {
        const message =
          error?.name === 'NotAllowedError'
            ? 'Camera/Microphone permission denied. Please allow access and refresh.'
            : 'Unable to access camera or microphone on this browser.';
        setPermissionError(message);
        setCameraStatus('idle');
        setRecordingStatus('idle');
      } finally {
        if (active) setCameraLoading(false);
      }
    };

    startMedia();

    return () => {
      active = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraStatus('idle');
      setRecordingStatus('idle');
    };
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  useEffect(() => {
    if (interviewPhase === INTERVIEW_PHASES.IN_PROGRESS) {
      enterFullscreen();
    }
  }, [interviewPhase]);

  // Tab-switch warnings (also logged to the server, best effort)
  useEffect(() => {
    const onVisibilityChange = () => {
      const now = Date.now();
      if (
        document.hidden &&
        interviewPhase === INTERVIEW_PHASES.IN_PROGRESS &&
        now - lastWarningTimeRef.current > 5000
      ) {
        lastWarningTimeRef.current = now;
        setWarningCount((prev) => {
          const next = prev + 1;
          if (next <= 3) {
            toast.error(`Tab warning ${next}/3: Please stay in the interview tab.`);
          }
          return next;
        });
        interviewService
          .logActivity(id, {
            type: 'tab-hidden',
            message: 'Candidate switched away from the interview tab',
            occurredAt: new Date().toISOString(),
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [interviewPhase, id]);

  const toggleTrack = useCallback((kind, enabled) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      if (track.kind === kind) track.enabled = enabled;
    });
  }, [stream]);

  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    isMicOnRef.current = next;
    toggleTrack('audio', next);
    setRecordingStatus(next || isCameraOn ? 'recording' : 'idle');
    if (!next && isListening) {
      stopSpeechRecognition();
    }
  };

  const handleToggleCamera = () => {
    const next = !isCameraOn;
    setIsCameraOn(next);
    toggleTrack('video', next);
    setCameraStatus(next ? 'active' : 'idle');
    setRecordingStatus(next || isMicOn ? 'recording' : 'idle');
  };

  const handleToggleListening = () => {
    if (isListening) {
      shouldResumeListeningRef.current = false;
      stopSpeechRecognition();
      setStatus('waiting');
    } else {
      shouldResumeListeningRef.current = true;
      handleUserStartSpeaking();
      startSpeechRecognition();
    }
  };

  const persistAnswer = useCallback(async (questionId, answerText, timeTaken) => {
    const final = (answerText || '').toString().trim();
    if (!final) return null;

    const payload = {
      questionId,
      answerText: final,
      confidenceLevel: 5,
      timeTaken,
    };

    const response = await interviewService.submitAnswer(payload);
    return response.data?.answer;
  }, []);

  const moveToIndex = useCallback((nextIndex) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setHasSpoken(false);
    setQuestionTimeLeft(questionDuration);
    setCurrentIndex(nextIndex);
  }, [questionDuration]);

  const handleMarkForReview = () => {
    const qid = currentQuestion?._id;
    if (!qid) return;
    setMarked((prev) => (prev.includes(qid) ? prev.filter((v) => v !== qid) : [...prev, qid]));
  };

  const handleSkip = useCallback(() => {
    const qid = currentQuestion?._id;
    if (!qid) return;
    setSkipped((prev) => (prev.includes(qid) ? prev : [...prev, qid]));
    setStatus('waiting');
    stopSpeechRecognition();
    if (currentIndex >= questions.length - 1) {
      setInterviewPhase(INTERVIEW_PHASES.COMPLETED);
      setStatus('completed');
      return;
    }
    moveToIndex(currentIndex + 1);
  }, [currentQuestion?._id, currentIndex, questions.length, moveToIndex, stopSpeechRecognition]);

  const handleNext = useCallback(async ({ autoSkipped = false } = {}) => {
    if (!currentQuestion || submitting) return;

    const questionId = currentQuestion._id;
    const finalAnswer = (currentAnswer || liveTranscript || '').toString().trim();

    setStatus('waiting');
    setVoiceState(VOICE_STATES.PROCESSING);
    setSubmitting(true);

    try {
      if (finalAnswer) {
        // Save whatever the candidate typed, even when the timer ran out
        setStatus('processing');
        try {
          await persistAnswer(questionId, finalAnswer, questionElapsed);
        } catch (saveError) {
          const errorMsg =
            saveError?.response?.data?.message || saveError?.message || 'Failed to save answer';
          toast.error(errorMsg, { id: 'save-error' });
          return; // stay on this question so nothing is lost
        }
        setAnswers((prev) => ({ ...prev, [questionId]: finalAnswer }));
        setSkipped((prev) => prev.filter((v) => v !== questionId));
        if (autoSkipped) {
          toast('Time is up. Your answer was saved.', { id: 'time-up' });
        }
      } else {
        setSkipped((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
        if (autoSkipped) {
          toast('Time is up. Question skipped.', { id: 'time-up' });
        }
      }

      stopSpeechRecognition();

      if (currentIndex >= questions.length - 1) {
        setInterviewPhase(INTERVIEW_PHASES.COMPLETED);
        setStatus('completed');
      } else {
        moveToIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('[handleNext] Error:', error?.message);
      toast.error(error?.response?.data?.message || 'Failed to process question.');
    } finally {
      if (voiceStateRef.current !== VOICE_STATES.SPEAKING) {
        setVoiceState(VOICE_STATES.IDLE);
      }
      setSubmitting(false);
    }
  }, [
    currentAnswer,
    currentIndex,
    currentQuestion,
    liveTranscript,
    moveToIndex,
    persistAnswer,
    questionElapsed,
    questions.length,
    stopSpeechRecognition,
    submitting,
  ]);

  // Always-fresh reference so the timer never uses a stale handleNext
  const handleNextRef = useRef(null);
  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  // Countdown (1 tick per second)
  useEffect(() => {
    if (interviewPhase !== INTERVIEW_PHASES.IN_PROGRESS || !questions.length) return undefined;

    const timer = setInterval(() => {
      setQuestionElapsed((prev) => prev + 1);
      setQuestionTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewPhase, questions.length, currentIndex]);

  // Time is up: save any typed answer, then move on
  useEffect(() => {
    if (
      interviewPhase === INTERVIEW_PHASES.IN_PROGRESS &&
      questions.length &&
      questionTimeLeft === 0 &&
      !submitting
    ) {
      handleNextRef.current?.({ autoSkipped: true });
    }
  }, [questionTimeLeft, interviewPhase, questions.length, submitting]);

  const handleStartInterview = async () => {
    setStarting(true);
    setInterviewPhase(INTERVIEW_PHASES.STARTED);
    try {
      // Only call start when pending; a page refresh mid-interview resumes instead of failing
      if (interview?.status === 'pending') {
        await interviewService.start(id);
      }
      await enterFullscreen();
      setQuestionTimeLeft(questionDuration);
      setInterviewPhase(INTERVIEW_PHASES.IN_PROGRESS);
      setStatus('waiting');
      setVoiceState(VOICE_STATES.IDLE);
      toast.success('Interview started in fullscreen mode.');
    } catch (error) {
      setInterviewPhase(INTERVIEW_PHASES.SETUP);
      toast.error(error?.response?.data?.message || 'Failed to start interview.');
    } finally {
      setStarting(false);
    }
  };

  const handleEditQuestion = (index) => {
    setInterviewPhase(INTERVIEW_PHASES.IN_PROGRESS);
    setStatus('waiting');
    moveToIndex(index);
  };

  const handleFinalSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    const toastId = toast.loading('Submitting interview and generating your report...');

    try {
      await interviewService.complete(id);
      toast.success('Interview submitted successfully!', { id: toastId });
      navigate(`/evaluation/${id}`, { replace: true });
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || error?.message || 'Failed to submit interview';
      toast.error(errorMsg, { id: toastId });
      setSubmitting(false); // allow retry
    }
  }, [submitting, id, navigate]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
          <p className="mt-3 text-sm">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (interview?.status === 'evaluated') {
    return <Navigate to={`/evaluation/${id}`} replace />;
  }

  if (interviewPhase === INTERVIEW_PHASES.SETUP || interviewPhase === INTERVIEW_PHASES.STARTED) {
    return (
      <InterviewJoinScreen
        stream={stream}
        isCameraOn={isCameraOn}
        isMicOn={isMicOn}
        permissionError={permissionError}
        cameraLoading={cameraLoading}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onStart={handleStartInterview}
        starting={starting}
        phase={interviewPhase}
        roleLabel={interview?.jobRole || 'technical'}
      />
    );
  }

  if (interviewPhase === INTERVIEW_PHASES.COMPLETED || status === 'completed') {
    return (
      <InterviewFinalReview
        questions={questions}
        answers={answers}
        skipped={skipped}
        marked={marked}
        onEditQuestion={handleEditQuestion}
        onSubmit={handleFinalSubmit}
        submitting={submitting}
      />
    );
  }

  return (
    <InterviewLiveStage
      question={currentQuestion}
      currentIndex={currentIndex}
      totalQuestions={questions.length}
      stream={stream}
      isCameraOn={isCameraOn}
      isMicOn={isMicOn}
      onToggleCamera={handleToggleCamera}
      onToggleMic={handleToggleMic}
      questionTimeLeft={questionTimeLeft}
      formatTime={formatTime}
      answerMode={answerMode}
      onAnswerModeChange={setAnswerMode}
      answerText={currentAnswer}
      onAnswerTextChange={setCurrentAnswer}
      isListening={isListening}
      voiceState={voiceState}
      speechSupported={speechSupported}
      liveTranscript={liveTranscript}
      onToggleListening={handleToggleListening}
      onRepeatQuestion={() => speak(currentQuestion?.questionText)}
      onNext={() => handleNext()}
      onSkip={handleSkip}
      onMarkForReview={handleMarkForReview}
      isMarked={marked.includes(currentQuestion?._id)}
      isSubmitting={submitting}
      isLastQuestion={currentIndex === questions.length - 1}
      status={status}
      warningCount={warningCount}
      isFullscreen={isFullscreen}
      onToggleFullscreen={handleFullscreen}
      onEndInterview={() => {
        stopSpeechRecognition();
        setInterviewPhase(INTERVIEW_PHASES.COMPLETED);
      }}
      cameraStatus={cameraStatus}
      recordingStatus={recordingStatus}
    />
  );
};

export default Interview;