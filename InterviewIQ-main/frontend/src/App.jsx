import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

const LandingEnhanced = lazy(() => import('./pages/LandingEnhanced'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NewInterview = lazy(() => import('./pages/NewInterview'));
const InterviewDetail = lazy(() => import('./pages/InterviewDetail'));
const Interview = lazy(() => import('./pages/Interview'));
const Evaluation = lazy(() => import('./pages/Evaluation'));
const Resumes = lazy(() => import('./pages/Resumes'));
const InterviewHistory = lazy(() => import('./pages/InterviewHistory'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const PreparationHub = lazy(() => import('./pages/PreparationHub'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const StudyPlan = lazy(() => import('./pages/StudyPlan'));
const Assessment = lazy(() => import('./pages/Assessment'));
const RateAnswers = lazy(() => import('./pages/RateAnswers'));

// Admin page
const Admin = lazy(() => import('./pages/Admin'));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
  </div>
);

// Admin-only route guard
const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  return user?.role === 'admin'
    ? children
    : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            },
          }}
        />

        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingEnhanced />
                  </PublicRoute>
                }
              />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />

              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                }
              />

              <Route path="/verify-otp" element={<VerifyOTP />} />

              {/* Protected application routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/new-interview" element={<NewInterview />} />
                <Route path="/interview/:id" element={<InterviewDetail />} />
                <Route path="/interview/live" element={<Interview />} />
                <Route path="/interview/:id/live" element={<Interview />} />
                <Route path="/evaluation/:id" element={<Evaluation />} />
                <Route path="/resumes" element={<Resumes />} />
                <Route path="/upload" element={<Resumes />} />
                <Route path="/analysis" element={<Resumes />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/reports" element={<Progress />} />
                <Route path="/interview-history" element={<InterviewHistory />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/learn" element={<PreparationHub />} />
                <Route path="/dsa" element={<PreparationHub />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/study-plan" element={<StudyPlan />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/rate-answers" element={<RateAnswers />} />

                {/* Admin route */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;