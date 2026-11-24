import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const normalizeLoginPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

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

const inputClass =
  'block w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-3 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20';

const Spinner = () => (
  <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/** Email sign-in and sign-up in one panel. The mode tabs replace the separate Login / Register screens. */
const EmailAuthForm = ({ mode, onModeChange, externalError = '' }) => {
  const isLogin = mode === 'login';
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setErrorMessage('');
  }, [mode]);

  useEffect(() => {
    if (externalError) setErrorMessage(externalError);
  }, [externalError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ---- Sign in (logic unchanged from the original Login page) ---- */
  const handleLogin = async () => {
    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();
      const rawResponse = await login(email, password);
      const response = normalizeLoginPayload(rawResponse);

      if (!response?.success || !response?.token || !response?.user) {
        const message = response?.message || 'Login failed';
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('token', response.token);
      toast.success(response.message || 'Logged in successfully');

      navigate('/dashboard', { replace: true });
    } catch (error) {
      const errorData = error?.response?.data;
      const errorMessage = error?.response?.data?.message || error.message || 'Login failed';
      setErrorMessage(errorMessage);

      // Check if account is not verified
      if (errorData?.code === 'ACCOUNT_NOT_VERIFIED') {
        toast.error('Please verify your email first');
        localStorage.setItem('pendingOtpEmail', formData.email.trim().toLowerCase());
        navigate('/verify-otp', {
          state: { email: formData.email, isLogin: true },
        });
        return;
      }

      toast.error(errorMessage);
    }
  };

  /* ---- Create account (logic unchanged from the original Register page) ---- */
  const handleRegister = async () => {
    try {
      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();
      const response = await register(name, email, password);

      if (response?.success === false && response?.code === 'USER_ALREADY_REGISTERED') {
        toast.error(response.message || 'User already registered. Please login.');
        onModeChange('login');
        return;
      }

      // Handle both new registration and resend OTP scenarios
      if (response?.message) {
        toast.success(response.message);
      } else {
        toast.success('Proceeding to email verification');
      }

      localStorage.setItem('pendingOtpEmail', email);

      // Redirect to verify OTP page for registration/resend-otp flow
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);

      // If email already registered (verified), suggest login
      if (errorMessage.includes('already registered')) {
        onModeChange('login');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      if (isLogin) await handleLogin();
      else await handleRegister();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-indigo-100/70 sm:p-6">
      <div role="tablist" aria-label="Sign in or create an account" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        {[
          { id: 'login', label: 'Sign in' },
          { id: 'register', label: 'Create account' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => onModeChange(t.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              mode === t.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {!isLogin ? (
          <div>
            <label htmlFor="auth-name" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-name"
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="John Doe"
                required
              />
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="auth-password" className="block text-sm font-semibold text-slate-800">
              Password
            </label>
            {isLogin ? (
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus-visible:underline"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={formData.password}
              onChange={handleChange}
              className={`${inputClass} pr-11`}
              placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
              required
              minLength={isLogin ? undefined : 6}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-[15px] font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Spinner />
              {isLogin ? 'Signing in…' : 'Creating account…'}
            </>
          ) : isLogin ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </div>
  );
};

export default EmailAuthForm;
