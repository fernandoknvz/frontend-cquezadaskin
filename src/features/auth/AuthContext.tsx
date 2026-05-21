import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  type AuthUser,
  loginRequest,
  logoutRequest,
  meRequest,
} from "@/services/authApi";
import {
  clearAuthStorage,
  getAccessToken,
  getRememberSession,
  getStoredUser,
  setAccessToken,
  setRememberSession,
  setStoredUser,
} from "@/services/authStorage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const decodeJwtExp = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setTokenState] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(true);

  const setToken = (value: string | null, persist = true) => {
    setTokenState(value);
    setAccessToken(value, persist);
  };

  const login = useCallback(async (identifier: string, password: string, remember = true) => {
    const response = await loginRequest(identifier, password);
    if (!response.token || !response.user) {
      throw new Error("No se pudo iniciar sesión");
    }

    setRememberSession(remember);
    setToken(response.token, remember);
    setUser(response.user);
    setStoredUser(response.user, remember);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setToken(null);
      setUser(null);
      clearAuthStorage();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await meRequest();
    setUser(response.user);
    setStoredUser(response.user, getRememberSession());
  }, []);

  useEffect(() => {
    const init = async () => {
      const currentToken = getAccessToken();
      if (!currentToken) {
        setLoading(false);
        setUser(null);
        setToken(null);
        return;
      }

      const exp = decodeJwtExp(currentToken);
      if (exp && Date.now() > exp) {
        clearAuthStorage();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
