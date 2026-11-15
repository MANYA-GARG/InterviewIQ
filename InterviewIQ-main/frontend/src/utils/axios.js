import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshRequestPromise = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Set initial token if available
const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
};

const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
if (storedToken) {
  setAuthToken(storedToken);
}

// Request interceptor - ALWAYS attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[AXIOS] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        console.error('Refresh token missing. Redirecting to login.');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        if (!refreshRequestPromise) {
          refreshRequestPromise = axios.post(
            `${API_URL}/auth/refresh-token`,
            { refreshToken: storedRefreshToken },
            { withCredentials: true }
          );
        }

        const response = await refreshRequestPromise;

        const accessToken =
          response?.data?.data?.accessToken ||
          response?.data?.accessToken ||
          response?.data?.token;

        if (!accessToken) {
          throw new Error('Refresh response missing accessToken');
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('token', accessToken);
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        refreshRequestPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
