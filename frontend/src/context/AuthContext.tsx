import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { SessionUser, AuthState } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

interface AuthContextValue extends AuthState {
  /** Initiates Google OAuth by doing a full-page redirect to the backend. */
  initiateLogin: () => void;
  /** Logs in using an email address, establishing a server session. */
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  /** Calls POST /api/auth/logout (server destroys session), then clears local state. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // On mount: check whether there is an active server session.
  // The backend sets an HTTP-only session cookie after Google OAuth completes.
  // We need credentials: "include" so the browser sends the cookie cross-port
  // (5173 → 4000).
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json() as Promise<{ user: SessionUser }>;
      })
      .then(({ user: sessionUser }) => {
        if (!cancelled) setUser(sessionUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /** Starts Google OAuth: full-page redirect so the browser carries the cookie. */
  const initiateLogin = useCallback(() => {
    window.location.href = `${API_BASE}/api/auth/google`;
  }, []);

  /** Logs in with email & establishes server session */
  const loginWithEmail = useCallback(async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }
      const { user: sessionUser } = (await res.json()) as { user: SessionUser };
      setUser(sessionUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Destroys the server session, then clears local user state. */
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, initiateLogin, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
