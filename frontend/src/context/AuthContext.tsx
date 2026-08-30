import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import type { SessionUser, AuthState } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const DEMO_STORAGE_KEY = 'reachinbox_auth_user';

interface AuthContextValue extends AuthState {
  /** Initiates Google OAuth by doing a full-page redirect to the backend, or starts demo session. */
  initiateLogin: () => void;
  /** Logs in using an email address, establishing a server session. */
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  /** Calls POST /api/auth/logout (server destroys session), then clears local state. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const saved = localStorage.getItem(DEMO_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // On mount: check whether there is an active server session or local session.
  useEffect(() => {
    let cancelled = false;
    if (API_BASE) {
      fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        .then((res) => {
          if (!res.ok) throw new Error('Not authenticated');
          return res.json() as Promise<{ user: SessionUser }>;
        })
        .then(({ user: sessionUser }) => {
          if (!cancelled) {
            setUser(sessionUser);
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sessionUser));
          }
        })
        .catch(() => {
          if (!cancelled && !localStorage.getItem(DEMO_STORAGE_KEY)) {
            setUser(null);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  /** Starts Google OAuth: full-page redirect if backend exists, or instant demo login. */
  const initiateLogin = useCallback(() => {
    if (API_BASE) {
      window.location.href = `${API_BASE}/api/auth/google`;
    } else {
      const googleUser: SessionUser = {
        id: 'usr_google_demo',
        name: 'Google User',
        email: 'user@reachinbox.ai',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google_demo_user',
      };
      setUser(googleUser);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(googleUser));
      toast.success('Signed in with Google!');
    }
  }, []);

  /** Logs in with email & establishes server session (with client-side fallback) */
  const loginWithEmail = useCallback(async (email: string, password?: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const namePart = cleanEmail.split('@')[0] || 'User';
    const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const fallbackUser: SessionUser = {
      id: `usr_${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    };

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (res.ok) {
          const { user: sessionUser } = (await res.json()) as { user: SessionUser };
          setUser(sessionUser);
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sessionUser));
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend login unavailable, using local demo session:', err);
      }
    }

    // Local fallback for standalone Vercel deployment
    setUser(fallbackUser);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fallbackUser));
    setIsLoading(false);
  }, []);

  /** Destroys the server session, then clears local user state. */
  const logout = useCallback(async () => {
    if (API_BASE) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        initiateLogin,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
