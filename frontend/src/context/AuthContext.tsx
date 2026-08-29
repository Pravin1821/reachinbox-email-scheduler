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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, initiateLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
