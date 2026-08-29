import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error')) {
      toast.error('Google sign-in failed. Please try again.');
    }
  }, [searchParams]);

  function handleGoogleLogin() {
    window.location.href = `${API_BASE}/api/auth/google`;
  }

  function handleInteractionNotice() {
    const msg = "Email/password login isn't available — please use Google Login above.";
    setFeedback(msg);
    toast.error(msg, {
      duration: 4000,
      icon: 'ℹ️',
    });
  }

  function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    handleInteractionNotice();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 font-sans select-none">
      {/* Centered White Card with clean border and subtle shadow */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-gray-200/80 animate-slide-up">
        {/* 1. Heading */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-7">
          Login
        </h1>

        {/* 2. Login with Google Button (Pale mint-green bg-green-50, Google G icon, dark text, pill shape) */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-green-50 hover:bg-green-100 text-gray-900 font-semibold text-sm transition-all duration-150 mb-6 shadow-xs border border-green-200/60 cursor-pointer"
        >
          {/* Real Google 'G' icon SVG */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Login with Google
        </button>

        {/* 3. Divider row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-normal whitespace-nowrap">
            or sign up through email
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 4 & 5. Email ID and Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3.5 mb-6">
          {/* Email ID input */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleInteractionNotice}
              placeholder="Email ID"
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-1 focus:ring-green-600 transition-all"
            />
          </div>

          {/* Password input */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleInteractionNotice}
              placeholder="Password"
              className="w-full bg-gray-100 border-0 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-1 focus:ring-green-600 transition-all"
            />
          </div>

          {/* Inline feedback message */}
          {feedback && (
            <p className="text-xs text-amber-600 font-medium px-1 py-0.5 leading-snug">
              {feedback}
            </p>
          )}

          {/* 6. Login button (Solid green bg-green-600, rounded-lg, bold white text) */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-sm transition-all mt-4 cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
