import { Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

// ==================== Lazy Loaded Pages ====================

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
const AIMonitoring = lazy(() => import('./pages/AIMonitoring'));

// ==================== Admin Pages ====================

const Admin = lazy(() => import('./pages/Admin'));
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const PlatformSettings = lazy(() => import('./pages/PlatformSettings'));

// ==================== Loading Fallback ====================

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
  </div>
);

// ==================== Admin Route Guard ====================

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  return user?.role === 'admin' ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// ==================== App ====================

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
              iconTheme: {
                primary: '#10b981',
                secondary: '#ecfdf5',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fef2f2',
              },
            },
          }}
        />

        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* ==================== Public Routes ==================== */}

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

              {/* ==================== Protected Routes ==================== */}

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

                {/* Resume Routes */}
                <Route path="/resumes" element={<Resumes />} />
                <Route path="/upload" element={<Resumes />} />
                <Route path="/analysis" element={<Resumes />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />

                {/* Progress & History */}
                <Route path="/reports" element={<Progress />} />
                <Route path="/interview-history" element={<InterviewHistory />} />
                <Route path="/progress" element={<Progress />} />

                {/* Learning */}
                <Route path="/learn" element={<PreparationHub />} />
                <Route path="/dsa" element={<PreparationHub />} />
                <Route path="/study-plan" element={<StudyPlan />} />

                {/* User Profile */}
                <Route path="/profile" element={<Profile />} />

                {/* Assessment */}
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/rate-answers" element={<RateAnswers />} />

                {/* ==================== Admin Routes ==================== */}

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/overview"
                  element={
                    <AdminRoute>
                      <AdminOverview />
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <AdminRoute>
                      <PlatformSettings />
                    </AdminRoute>
                  }
                />
              </Route>
              <Route path="/admin/ai-monitoring" element={<AIMonitoring />} />

              {/* ==================== Fallback Route ==================== */}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;