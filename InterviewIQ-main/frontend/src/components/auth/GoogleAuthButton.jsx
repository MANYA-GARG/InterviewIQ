import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import { useAppStore } from '../../store/appStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const GoogleLogo = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 0 1-10.72-3.79H1.4v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.34 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.4a12 12 0 0 0 0 10.8l3.94-3.1Z" />
    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.6l3.94 3.1A7.2 7.2 0 0 1 12 4.75Z" />
  </svg>
);

const normalizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (payload?.success !== undefined || payload?.token || payload?.user) return payload;
  if (payload?.data && typeof payload.data === 'object') {
    return { ...payload, ...payload.data, message: payload.message || payload.data.message };
  }
  return payload;
};

/**
 * Google sign-in / sign-up. Needs VITE_GOOGLE_CLIENT_ID in the frontend .env and
 * a backend POST /auth/google that accepts { credential } (Google ID token) and
 * returns { success, token, user, refreshToken? }.
 */
const GoogleAuthButton = ({
  text = 'continue_with', // Google's own label: 'continue_with' | 'signup_with' | 'signin_with'
  fallbackLabel = 'Continue with Google',
  onError,
  pill = false,
}) => {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let cancelled = false;

    const handleCredential = async (googleResponse) => {
      if (!googleResponse?.credential) {
        toast.error('Google sign-in was cancelled');
        return;
      }

      setBusy(true);
      onError?.('');

      try {
        const res = await api.post('/auth/google', { credential: googleResponse.credential });
        const response = normalizePayload(res.data);

        if (!response?.success || !response?.token || !response?.user) {
          const message = response?.message || 'Google sign-in failed';
          onError?.(message);
          toast.error(message);
          return;
        }

        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('accessToken', response.token);
        localStorage.setItem('token', response.token);
        if (response.refreshToken) localStorage.setItem('refreshToken', response.refreshToken);
        useAppStore.getState().setSession({ user: response.user, token: response.token });

        toast.success(response.message || 'Logged in successfully');
        // Full navigation so AuthProvider re-reads the stored session
        window.location.assign('/dashboard');
      } catch (error) {
        const message = error?.response?.data?.message || error.message || 'Google sign-in failed';
        onError?.(message);
        toast.error(message);
      } finally {
        setBusy(false);
      }
    };

    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: pill ? 'pill' : 'rectangular',
        logo_alignment: 'left',
        width: Math.min(Math.max(btnRef.current.offsetWidth, 200), 400),
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return () => { cancelled = true; };
    }

    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => {
      cancelled = true;
      script.removeEventListener('load', init);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        onClick={() => toast.error('Google sign-in is not set up yet. Use email and password for now.')}
        className={`flex w-full items-center justify-center gap-3 ${pill ? 'rounded-full py-3.5' : 'rounded-lg py-3'} border border-slate-300 bg-white px-4 text-[15px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/25`}
      >
        <GoogleLogo />
        {fallbackLabel}
      </button>
    );
  }

  return (
    <div className="relative">
      <div
        ref={btnRef}
        className={`flex min-h-[44px] w-full justify-center ${busy ? 'pointer-events-none opacity-60' : ''}`}
      />
      {!ready ? (
        <div className={`absolute inset-0 flex items-center justify-center ${pill ? 'rounded-full' : 'rounded-lg'} border border-slate-300 bg-white text-sm font-medium text-slate-500`}>
          Loading Google…
        </div>
      ) : null}
    </div>
  );
};

export default GoogleAuthButton;
