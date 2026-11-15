import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock } from 'lucide-react';

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

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

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
          state: { email: formData.email, isLogin: true } 
        });
        return;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>
          </form>

          {errorMessage ? (
            <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
