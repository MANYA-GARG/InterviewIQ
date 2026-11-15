import api from '../utils/axios';

const requestCache = new Map();
const CACHE_TTL_MS = 30 * 1000;

const getCacheKey = (url, params) => `${url}:${JSON.stringify(params || {})}`;

const cachedGet = async (url, params, ttl = CACHE_TTL_MS) => {
  const key = getCacheKey(url, params);
  const now = Date.now();
  const cachedEntry = requestCache.get(key);

  if (cachedEntry && now - cachedEntry.timestamp < ttl) {
    return cachedEntry.value;
  }

  const response = await api.get(url, params ? { params } : undefined);
  requestCache.set(key, {
    timestamp: now,
    value: response,
  });

  return response;
};

export const clearRequestCache = () => {
  requestCache.clear();
};

const normalize = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (payload.data && typeof payload.data === 'object') {
    return payload;
  }

  return {
    ...payload,
    data: payload,
  };
};

export const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  verifyOTP: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return response.data;
  },

  resendOTP: async (data) => {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const resumeService = {
  upload: async (formData, options = {}) => {
    const { onUploadProgress } = options;
    const response = await api.post('/resumes', formData, {
      headers: { 'Content-Type': undefined },
      onUploadProgress,
    });
    return normalize(response.data);
  },

  getAll: async () => {
    const response = await api.get('/resumes');
    return normalize(response.data);
  },

  getById: async (id) => {
    const response = await api.get(`/resumes/${id}`);
    return normalize(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`/resumes/${id}`);
    return normalize(response.data);
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/resumes/${id}/analysis`);
    return normalize(response.data);
  },

  match: async (id, data) => {
    const response = await api.post(`/resumes/${id}/match`, data);
    return normalize(response.data);
  },
};

export const interviewService = {
  create: async (data) => {
    const response = await api.post('/interviews', data);
    return normalize(response.data);
  },

  getAll: async (params) => {
    const response = await api.get('/interviews', { params });
    return normalize(response.data);
  },

  getById: async (id) => {
    const response = await api.get(`/interviews/${id}`);
    return normalize(response.data);
  },

  start: async (id) => {
    const response = await api.post(`/interviews/${id}/start`);
    return normalize(response.data);
  },

  submitAnswer: async (data) => {
    const response = await api.post('/interviews/answer', data);
    return normalize(response.data);
  },

  submitVoiceAnswer: async (formData) => {
    const response = await api.post('/interviews/answer/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalize(response.data);
  },

  complete: async (id, data = {}) => {
    const response = await api.post(`/interviews/${id}/complete`, data);
    return normalize(response.data);
  },

  logActivity: async (id, data) => {
    const response = await api.post(`/interviews/${id}/activity`, data);
    return normalize(response.data);
  },

  delete: async (id) => {
    const response = await api.delete(`/interviews/${id}`);
    return normalize(response.data);
  },

  generateFromResume: async (data) => {
    const response = await api.post('/interview/generate-from-resume', data);
    return normalize(response.data);
  },

  saveRecording: async (formData) => {
    const response = await api.post('/interview/save-recording', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalize(response.data);
  },
};

export const evaluationService = {
  evaluate: async (interviewId) => {
    const response = await api.post(`/evaluations/${interviewId}/evaluate`);
    return normalize(response.data);
  },

  getByInterviewId: async (interviewId) => {
    const response = await api.get(`/evaluations/${interviewId}`);
    return normalize(response.data);
  },

  getAll: async (params) => {
    const response = await api.get('/evaluations', { params });
    return normalize(response.data);
  },
};

export const reportService = {
  getProgress: async () => {
    const response = await cachedGet('/reports/progress');
    return normalize(response.data);
  },

  getDetailed: async (params) => {
    const response = await cachedGet('/reports/detailed', params);
    return normalize(response.data);
  },

  getTrend: async () => {
    const response = await cachedGet('/reports/trend');
    return normalize(response.data);
  },

  getPerformance: async () => {
    const response = await cachedGet('/reports/performance');
    return normalize(response.data);
  },

  getCategoryScores: async () => {
    const response = await cachedGet('/reports/category-scores');
    return normalize(response.data);
  },

  getSkills: async () => {
    const response = await cachedGet('/reports/skills');
    return normalize(response.data);
  },

  getInsights: async () => {
    const response = await cachedGet('/reports/insights');
    return normalize(response.data);
  },

  getHeatmap: async () => {
    const response = await cachedGet('/reports/heatmap');
    return normalize(response.data);
  },

  getProgressTrends: async () => {
    const response = await cachedGet('/reports/progress-trends');
    return normalize(response.data);
  },
};

export const dashboardService = {
  getSummary: async () => {
    const response = await cachedGet('/dashboard/summary');
    return normalize(response.data);
  },
};

export const resumeBuilderService = {
  list: async () => normalize((await api.get('/resume-builder')).data),
  create: async (data) => normalize((await api.post('/resume-builder', data)).data),
  update: async (id, data) => normalize((await api.put(`/resume-builder/${id}`, data)).data),
  remove: async (id) => normalize((await api.delete(`/resume-builder/${id}`)).data),
  improve: async (data) => normalize((await api.post('/resume-builder/ai/improve', data)).data),
  summary: async (data) => normalize((await api.post('/resume-builder/ai/summary', data)).data),
  tailor: async (data) => normalize((await api.post('/resume-builder/ai/tailor', data)).data),
};