import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Mail } from 'lucide-react';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || localStorage.getItem('pendingOtpEmail');
  const isLogin = location.state?.isLogin || false;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await verifyOTP(email, otp.trim());
      localStorage.removeItem('pendingOtpEmail');
      toast.success('Email verified successfully!');
      
      // Redirect based on flow
      if (isLogin) {
        // Coming from login attempt - go to dashboard
        navigate('/dashboard');
      } else {
        // Coming from registration - go to resume upload
        navigate('/resumes');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is missing. Please register or login again.');
      navigate('/register');
      return;
    }

    setResending(true);
    try {
      await authService.resendOTP({ email });
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Complete your login by verifying your email' : 'Complete your registration by verifying your email'}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Enter the OTP sent to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field pl-10 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              loading={loading}
              className="w-full"
            >
              Verify OTP
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
