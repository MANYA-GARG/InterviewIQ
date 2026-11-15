import { createContext, useContext, useState, useEffect } from 'react';
import { authService, clearRequestCache } from '../services/api';
import { useAppStore } from '../store/appStore';

const AuthContext = createContext(null);

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const normalizeLoginPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  // Support both { success, token, user } and { data: { success, token, user } }
  if (payload?.success !== undefined || payload?.token || payload?.user) {
    return payload;
  }

  if (payload?.data && typeof payload.data === 'object') {
    return {
      ...payload,
      ...payload.data,
      message: payload.message || payload.data.message,
    };
  }

  return payload;
};

const hasStoredSession = () => Boolean(localStorage.getItem('accessToken') || localStorage.getItem('token'));

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    setUser(storedUser);
    useAppStore.getState().setSession({ user: storedUser, token: storedToken });
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const rawResponse = await authService.login({ email, password });
    const response = normalizeLoginPayload(rawResponse);

    if (response?.success && response?.user && response?.token) {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('token', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      useAppStore.getState().setSession({ user: response.user, token: response.token });
    } else {
      console.error('Login response missing required fields:', response);
    }

    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register({ name, email, password });
    return response;
  };

  const verifyOTP = async (email, otp) => {
    const response = await authService.verifyOTP({ email, otp });
    if (response?.user) {
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      useAppStore.getState().setSession({ user: response.user, token: response.token });
    }
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear in-memory user
      setUser(null);

      // Remove auth tokens and user info
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear persisted zustand store keys related to active session/resume
      try {
        // Clear resume and other session data from store
        useAppStore.getState().clearAllSessionData();

        // Clear any in-memory API cache to avoid showing cached analysis
        try { clearRequestCache(); } catch (e) { /* ignore */ }

        // Remove the persisted storage entry so stale data won't rehydrate
        const STORE_KEY = 'interviewiq-app-store';
        localStorage.removeItem(STORE_KEY);
      } catch (storeClearError) {
        console.error('Failed to fully clear app store on logout:', storeClearError);
        // Fallback: at least clear session slice
        useAppStore.getState().clearSession();
        useAppStore.getState().clearResumeState && useAppStore.getState().clearResumeState();
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    verifyOTP,
    logout,
    isAuthenticated: !!user || hasStoredSession(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
