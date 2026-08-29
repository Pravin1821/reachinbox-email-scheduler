import { useEffect } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import type { ReactNode } from 'react';

/** Shows a full-screen spinner while the server session check is in-flight. */
function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

/**
 * Dashboard wrapper that reads ?slack= query params from the URL
 * (set by the backend after the Slack OAuth callback) and shows a toast.
 */
function DashboardWithSlackToast() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const slack = searchParams.get('slack');
    if (slack === 'connected') {
      toast.success('Slack connected successfully! 🎉');
      setSearchParams({}, { replace: true });
    } else if (slack === 'error') {
      toast.error('Slack connection failed. Please try again.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardWithSlackToast />
          </ProtectedRoute>
        }
      />
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
