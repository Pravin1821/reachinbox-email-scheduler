import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import type { GoogleUser } from '../../types';

function decodeGoogleJwt(credential: string): GoogleUser {
  const payload = credential.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded) as GoogleUser;
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Already logged in → redirect
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  function handleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      toast.error('No credential returned from Google.');
      return;
    }
    try {
      const user = decodeGoogleJwt(response.credential);
      login(response.credential, user);
      toast.success(`Welcome, ${user.given_name}!`);
      navigate('/dashboard', { replace: true });
    } catch {
      toast.error('Failed to parse Google credential.');
    }
  }

  function handleError() {
    toast.error('Google sign-in was cancelled or failed.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-purple/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Card */}
        <div className="glass-card p-10 border border-white/10 text-center animate-slide-up">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold gradient-text">ReachInbox</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Sign in to manage your email campaigns,<br />
            schedule sends, and track deliveries.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {['Smart Scheduling', 'Bulk CSV Import', 'Elasticsearch Search'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Google Login button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              theme="filled_black"
              shape="rectangular"
              size="large"
              width="320"
              text="signin_with"
              useOneTap={false}
            />
          </div>

          <p className="mt-6 text-xs text-white/25">
            By signing in, you agree to our terms of service.
          </p>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-white/25 text-xs mt-6">
          ReachInbox · Email Job Scheduler
        </p>
      </div>
    </div>
  );
}
