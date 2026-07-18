"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  clearTokens,
  getAccessToken,
  storeTokens,
} from "./api";

interface SessionUser {
  email: string;
  user_id: string;
  role?: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

function decodeUserFromToken(token: string): SessionUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (token) setUser(decodeUserFromToken(token));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    storeTokens(res.access_token, res.refresh_token);
    setUser(decodeUserFromToken(res.access_token));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // token may already be expired; clear locally regardless
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
