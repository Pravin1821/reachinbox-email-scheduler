import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { GoogleUser, AuthState } from '../types';

interface AuthContextValue extends AuthState {
  login: (credential: string, user: GoogleUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_CREDENTIAL_KEY = 'ri_credential';
const STORAGE_USER_KEY = 'ri_user';

function parseStoredUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credential, setCredential] = useState<string | null>(
    () => localStorage.getItem(STORAGE_CREDENTIAL_KEY),
  );
  const [user, setUser] = useState<GoogleUser | null>(parseStoredUser);

  const isAuthenticated = Boolean(credential && user);

  const login = useCallback((cred: string, googleUser: GoogleUser) => {
    localStorage.setItem(STORAGE_CREDENTIAL_KEY, cred);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(googleUser));
    setCredential(cred);
    setUser(googleUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_CREDENTIAL_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setCredential(null);
    setUser(null);
  }, []);

  // Validate that stored token has not expired.
  // Google JWT exp is in the payload — quick check without a library.
  useEffect(() => {
    if (!credential) return;
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      const expMs = payload.exp * 1000;
      if (Date.now() > expMs) {
        // Token expired — log out silently
        logout();
      }
    } catch {
      // Malformed token — log out
      logout();
    }
  }, [credential, logout]);

  return (
    <AuthContext.Provider value={{ user, credential, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
